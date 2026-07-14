import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { ApiError } from "@/server/http/api-error";

function isPrivateIpv4(address: string): boolean {
    const octets = address.split(".").map(Number);
    if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part))) return true;

    const [first, second] = octets;
    return first === 0 ||
        first === 10 ||
        first === 127 ||
        (first === 169 && second === 254) ||
        (first === 172 && second >= 16 && second <= 31) ||
        (first === 192 && second === 168) ||
        first >= 224;
}

function isPrivateIpv6(address: string): boolean {
    const normalized = address.toLowerCase();
    if (normalized.startsWith("::ffff:")) {
        return isPrivateIpv4(normalized.slice("::ffff:".length));
    }

    const firstHextet = Number.parseInt(normalized.split(":")[0] || "0", 16);
    const isGlobalUnicast = firstHextet >= 0x2000 && firstHextet <= 0x3fff;

    return !isGlobalUnicast ||
        normalized.startsWith("2001:db8:") ||
        normalized === "::1" ||
        normalized === "::";
}

function isPrivateAddress(address: string): boolean {
    const family = isIP(address);
    if (family === 4) return isPrivateIpv4(address);
    if (family === 6) return isPrivateIpv6(address);
    return true;
}

export interface SafeOutboundTarget {
    url: URL;
    address: string;
    family: 4 | 6;
}

export async function resolveSafeOutboundBaseUrl(baseUrl: string): Promise<SafeOutboundTarget> {
    const url = new URL(baseUrl);
    if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.port ||
        url.search ||
        url.hash
    ) {
        throw new ApiError(400, "UNSAFE_API_URL", "自定义 API 地址必须是标准 HTTPS 地址");
    }

    const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
    if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
        throw new ApiError(400, "UNSAFE_API_URL", "自定义 API 地址不可使用本地或内网地址");
    }

    let addresses: Array<{ address: string; family: number }>;
    try {
        addresses = await lookup(hostname, { all: true, verbatim: true });
    } catch {
        throw new ApiError(400, "API_HOST_UNRESOLVED", "自定义 API 域名无法解析");
    }

    if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
        throw new ApiError(400, "UNSAFE_API_URL", "自定义 API 地址不可指向本地或内网");
    }

    const selected = addresses[0];
    if (selected.family !== 4 && selected.family !== 6) {
        throw new ApiError(400, "UNSAFE_API_URL", "自定义 API 域名解析结果无效");
    }
    return {
        url,
        address: selected.address,
        family: selected.family as 4 | 6,
    };
}

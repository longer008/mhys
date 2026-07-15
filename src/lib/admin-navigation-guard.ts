export const ADMIN_NAVIGATION_REQUEST_EVENT =
    "mhys:admin-navigation-request";

/**
 * 请求执行后台页面导航。任一监听器取消事件时，调用方必须停止导航。
 */
export function requestAdminNavigation(): boolean {
    if (typeof window === "undefined") return true;

    return window.dispatchEvent(
        new CustomEvent(ADMIN_NAVIGATION_REQUEST_EVENT, {
            cancelable: true,
        })
    );
}

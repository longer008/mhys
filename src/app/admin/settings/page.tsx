'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import {
    AlertCircle,
    BookOpenText,
    BrainCircuit,
    CheckCircle2,
    Gauge,
    KeyRound,
    LayoutTemplate,
    RotateCcw,
    Save,
    TestTube2,
} from 'lucide-react';
import {
    METHOD_LABELS,
    aiConnectionTestSchema,
    divinationRulesSettingsSchema,
    interpretationPreferencesSchema,
    siteContentSettingsSchema,
    usageLimitSettingsSchema,
    type AdminSettingsSnapshot,
    type SettingsSection,
    type SettingsSectionUpdate,
} from '@/features/settings/contracts';
import type { DivinationMethod } from '@/features/divination/types';
import {
    ADMIN_NAVIGATION_REQUEST_EVENT,
    requestAdminNavigation,
} from '@/lib/admin-navigation-guard';
import { fetchApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Feedback = { type: 'success' | 'error' | 'info'; message: string };

const SECTION_NAV = [
    { key: 'site', label: '站点内容', description: '首页与说明文字', icon: LayoutTemplate },
    { key: 'divination', label: '起卦规则', description: '方式与功能开关', icon: BookOpenText },
    { key: 'interpretation', label: 'AI 解读', description: '详略与文风', icon: BrainCircuit },
    { key: 'limits', label: '使用额度', description: '访问频率与每日上限', icon: Gauge },
    { key: 'aiProvider', label: 'API 服务', description: '地址、模型与密钥', icon: KeyRound },
] as const;

const fetcher = (url: string) => fetchApi<AdminSettingsSnapshot>(url);

function isSame(left: unknown, right: unknown): boolean {
    return JSON.stringify(left) === JSON.stringify(right);
}

function normalizeAiBaseUrl(value: string): string {
    try {
        const url = new URL(value);
        url.pathname = url.pathname.replace(/\/+$/, '');
        return url.toString().replace(/\/$/, '');
    } catch {
        return value.trim();
    }
}

function formatUpdatedAt(
    value: string | undefined,
    section: SettingsSection
): string {
    if (!value) {
        return section === 'aiProvider'
            ? '尚未保存后台配置'
            : '当前使用默认配置';
    }
    return `最后保存于 ${new Date(value).toLocaleString('zh-CN')}`;
}

function Field({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block space-y-2">
            <span className="flex items-baseline justify-between gap-4">
                <span className="text-sm font-medium text-stone-800">{label}</span>
                {hint && <span className="text-xs text-stone-400">{hint}</span>}
            </span>
            {children}
        </label>
    );
}

function TextArea({
    value,
    onChange,
    rows = 3,
    placeholder,
}: {
    value: string;
    onChange: (value: string) => void;
    rows?: number;
    placeholder?: string;
}) {
    return (
        <textarea
            value={value}
            rows={rows}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
            className="w-full resize-y rounded-md border border-stone-300 bg-white px-3 py-2 text-sm leading-6 text-stone-800 outline-none transition-[border-color,box-shadow] placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-300/50"
        />
    );
}

function ToggleRow({
    title,
    description,
    checked,
    onChange,
}: {
    title: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between gap-6 border-b border-stone-200 py-4 last:border-b-0">
            <div>
                <p className="text-sm font-medium text-stone-800">{title}</p>
                <p className="mt-1 text-xs leading-5 text-stone-500">{description}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-label={title}
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-[var(--cinnabar)]' : 'bg-stone-300'}`}
            >
                <span
                    className={`absolute left-0 top-1 size-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
                />
            </button>
        </div>
    );
}

function ChoiceButton({
    selected,
    title,
    description,
    onClick,
}: {
    selected: boolean;
    title: string;
    description: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={onClick}
            className={`min-h-24 border px-4 py-3 text-left transition-colors ${selected
                ? 'border-[var(--cinnabar)] bg-[#f8efeb] text-stone-900'
                : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                }`}
        >
            <span className="block text-sm font-medium">{title}</span>
            <span className="mt-2 block text-xs leading-5 text-stone-500">{description}</span>
        </button>
    );
}

export default function AdminSettingsPage() {
    const { data, error, isLoading, mutate } = useSWR<AdminSettingsSnapshot>(
        '/api/admin/settings',
        fetcher,
        { revalidateOnFocus: false }
    );
    const [activeSection, setActiveSection] = useState<SettingsSection>('site');
    const [draft, setDraft] = useState<AdminSettingsSnapshot | null>(null);
    const [baseline, setBaseline] = useState<AdminSettingsSnapshot | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [savingSection, setSavingSection] = useState<SettingsSection | null>(null);
    const [testingAi, setTestingAi] = useState(false);
    const [resetConfirmation, setResetConfirmation] = useState<SettingsSection | null>(null);
    const [feedback, setFeedback] = useState<Partial<Record<SettingsSection, Feedback>>>({});

    useEffect(() => {
        if (!data || draft) return;
        setDraft(data);
        setBaseline(data);
    }, [data, draft]);

    const dirtySections = useMemo(() => {
        const dirty = new Set<SettingsSection>();
        if (!draft || !baseline) return dirty;
        if (!isSame(draft.site, baseline.site)) dirty.add('site');
        if (!isSame(draft.divination, baseline.divination)) dirty.add('divination');
        if (!isSame(draft.interpretation, baseline.interpretation)) dirty.add('interpretation');
        if (!isSame(draft.limits, baseline.limits)) dirty.add('limits');
        if (
            draft.aiProvider.baseUrl !== baseline.aiProvider.baseUrl ||
            draft.aiProvider.model !== baseline.aiProvider.model ||
            apiKey.trim()
        ) {
            dirty.add('aiProvider');
        }
        return dirty;
    }, [apiKey, baseline, draft]);

    const aiBaseUrlChanged = Boolean(
        draft &&
        baseline &&
        normalizeAiBaseUrl(draft.aiProvider.baseUrl) !==
        normalizeAiBaseUrl(baseline.aiProvider.baseUrl)
    );
    const hasUnsavedChanges = dirtySections.size > 0;

    useEffect(() => {
        if (!hasUnsavedChanges) return;

        const currentUrl = window.location.href;
        const currentHistoryState = window.history.state;
        const handleNavigationRequest = (event: Event) => {
            if (!window.confirm('当前设置尚未保存，确定离开此页面吗？')) {
                event.preventDefault();
            }
        };
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };
        const handleLinkClick = (event: MouseEvent) => {
            if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.ctrlKey ||
                event.metaKey ||
                event.shiftKey ||
                event.altKey
            ) {
                return;
            }
            const target = event.target;
            if (!(target instanceof Element)) return;
            const link = target.closest('a');
            if (!link || link.target === '_blank') return;

            const destination = new URL(link.href, window.location.href);
            if (
                destination.origin === window.location.origin &&
                destination.href !== window.location.href &&
                !requestAdminNavigation()
            ) {
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        };
        const handlePopState = (event: PopStateEvent) => {
            if (requestAdminNavigation()) return;

            // popstate 本身不可取消，需恢复后退前的 URL 与 Next.js history state。
            event.stopImmediatePropagation();
            window.history.pushState(
                currentHistoryState,
                '',
                currentUrl
            );
        };
        window.addEventListener(
            ADMIN_NAVIGATION_REQUEST_EVENT,
            handleNavigationRequest
        );
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('popstate', handlePopState, true);
        document.addEventListener('click', handleLinkClick, true);
        return () => {
            window.removeEventListener(
                ADMIN_NAVIGATION_REQUEST_EVENT,
                handleNavigationRequest
            );
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState, true);
            document.removeEventListener('click', handleLinkClick, true);
        };
    }, [hasUnsavedChanges]);

    // 只提交当前分组，其他分组的未保存草稿必须原样保留。
    const applySectionSnapshot = (
        section: SettingsSection,
        snapshot: AdminSettingsSnapshot
    ) => {
        setDraft((previous) => previous
            ? {
                ...previous,
                [section]: snapshot[section],
                updatedAt: snapshot.updatedAt,
            }
            : snapshot
        );
        setBaseline(snapshot);
        if (section === 'aiProvider') setApiKey('');
        setResetConfirmation(null);
        void mutate(snapshot, false);
    };

    const setSectionFeedback = (section: SettingsSection, next: Feedback | undefined) => {
        setFeedback((previous) => ({ ...previous, [section]: next }));
    };

    const validateSection = (section: SettingsSection): string | null => {
        if (!draft) return '设置尚未加载完成';
        if (
            section === 'aiProvider' &&
            !apiKey.trim() &&
            (draft.aiProvider.apiKeyStatus !== 'configured' || aiBaseUrlChanged)
        ) {
            return aiBaseUrlChanged
                ? '更换 API 地址时必须填写新的 API Key'
                : '请填写 API Key';
        }
        const result = section === 'site'
            ? siteContentSettingsSchema.safeParse(draft.site)
            : section === 'divination'
                ? divinationRulesSettingsSchema.safeParse(draft.divination)
                : section === 'interpretation'
                    ? interpretationPreferencesSchema.safeParse(draft.interpretation)
                    : section === 'limits'
                        ? usageLimitSettingsSchema.safeParse(draft.limits)
                        : aiConnectionTestSchema.safeParse({
                            baseUrl: draft.aiProvider.baseUrl,
                            model: draft.aiProvider.model,
                            ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
                        });

        return result.success ? null : result.error.issues[0]?.message || '设置内容无效';
    };

    const createUpdate = (section: SettingsSection): SettingsSectionUpdate | null => {
        if (!draft) return null;
        if (section === 'site') return { section, value: draft.site };
        if (section === 'divination') return { section, value: draft.divination };
        if (section === 'interpretation') return { section, value: draft.interpretation };
        if (section === 'limits') return { section, value: draft.limits };
        return {
            section: 'aiProvider',
            value: {
                baseUrl: draft.aiProvider.baseUrl,
                model: draft.aiProvider.model,
                ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
            },
        };
    };

    const handleSave = async (section: SettingsSection) => {
        const validationError = validateSection(section);
        if (validationError) {
            setSectionFeedback(section, { type: 'error', message: validationError });
            return;
        }
        const update = createUpdate(section);
        if (!update) return;

        setSavingSection(section);
        setSectionFeedback(section, undefined);
        try {
            const snapshot = await fetchApi<AdminSettingsSnapshot>('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(update),
            });
            applySectionSnapshot(section, snapshot);
            setSectionFeedback(section, { type: 'success', message: '设置已保存并立即生效' });
        } catch (caughtError) {
            setSectionFeedback(section, {
                type: 'error',
                message: caughtError instanceof Error ? caughtError.message : '保存失败',
            });
        } finally {
            setSavingSection(null);
        }
    };

    const handleReset = async (section: SettingsSection) => {
        if (resetConfirmation !== section) {
            setResetConfirmation(section);
            setSectionFeedback(section, { type: 'info', message: '再次点击“确认恢复”才会恢复默认配置' });
            return;
        }

        setSavingSection(section);
        try {
            const snapshot = await fetchApi<AdminSettingsSnapshot>('/api/admin/settings', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ section }),
            });
            applySectionSnapshot(section, snapshot);
            setSectionFeedback(section, {
                type: 'success',
                message: section === 'aiProvider' ? '已恢复使用环境变量中的 API 配置' : '已恢复默认设置',
            });
        } catch (caughtError) {
            setSectionFeedback(section, {
                type: 'error',
                message: caughtError instanceof Error ? caughtError.message : '恢复失败',
            });
        } finally {
            setSavingSection(null);
        }
    };

    const handleTestAi = async () => {
        if (!draft) return;
        const validationError = validateSection('aiProvider');
        if (validationError) {
            setSectionFeedback('aiProvider', { type: 'error', message: validationError });
            return;
        }

        setTestingAi(true);
        setSectionFeedback('aiProvider', { type: 'info', message: '正在连接 AI 服务…' });
        try {
            const result = await fetchApi<{ provider: string; model: string; latencyMs: number }>(
                '/api/admin/settings/test-ai',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        baseUrl: draft.aiProvider.baseUrl,
                        model: draft.aiProvider.model,
                        ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
                    }),
                }
            );
            setSectionFeedback('aiProvider', {
                type: 'success',
                message: `连接成功，${result.model} 响应耗时 ${result.latencyMs} 毫秒`,
            });
        } catch (caughtError) {
            setSectionFeedback('aiProvider', {
                type: 'error',
                message: caughtError instanceof Error ? caughtError.message : '连接测试失败',
            });
        } finally {
            setTestingAi(false);
        }
    };

    const toggleMethod = (method: DivinationMethod) => {
        if (!draft) return;
        const enabled = draft.divination.enabledMethods.includes(method);
        const nextMethods = enabled
            ? draft.divination.enabledMethods.filter((item) => item !== method)
            : [...draft.divination.enabledMethods, method];

        if (nextMethods.length === 0) {
            setSectionFeedback('divination', { type: 'error', message: '至少保留一种起卦方式' });
            return;
        }
        const nextDefault = nextMethods.includes(draft.divination.defaultMethod)
            ? draft.divination.defaultMethod
            : nextMethods[0];
        setDraft({
            ...draft,
            divination: {
                ...draft.divination,
                enabledMethods: nextMethods,
                defaultMethod: nextDefault,
            },
        });
    };

    if (error) {
        return (
            <div className="border-l-2 border-red-500 bg-red-50 px-5 py-4 text-sm text-red-700">
                设置加载失败，请刷新页面重试。
            </div>
        );
    }

    if (isLoading || !draft || !baseline) {
        return (
            <div className="space-y-6">
                <div className="h-16 animate-pulse bg-stone-200/70" />
                <div className="h-[34rem] animate-pulse bg-stone-200/70" />
            </div>
        );
    }

    const currentFeedback = feedback[activeSection];
    const hasStoredApiKey =
        draft.aiProvider.source === 'database' &&
        draft.aiProvider.apiKeyStatus === 'configured';
    const apiKeyHint = hasStoredApiKey
        ? '已配置，留空保持不变'
        : draft.aiProvider.apiKeyStatus === 'configured'
            ? '环境变量已有密钥，保存后台配置时需重新填写'
            : '尚未配置';

    return (
        <div className="space-y-6 font-ui-cn">
            <header>
                <p className="text-xs font-medium tracking-[0.2em] text-[var(--cinnabar)]">站点控制台</p>
                <h1 className="mt-2 font-song text-3xl font-semibold text-stone-900">系统设置</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
                    管理首页内容、起卦规则与 AI 解读服务。每个分组独立保存，修改后立即生效。
                </p>
            </header>

            <div className="overflow-hidden border border-stone-200 bg-[#fcfaf6] shadow-[0_24px_55px_-45px_rgba(58,49,39,.65)]">
                <div className="grid lg:grid-cols-[15rem_minmax(0,1fr)]">
                    <nav className="flex gap-1 overflow-x-auto border-b border-stone-200 bg-stone-100/70 p-3 lg:block lg:space-y-1 lg:border-b-0 lg:border-r lg:p-4" aria-label="设置分类">
                        {SECTION_NAV.map((item) => {
                            const active = activeSection === item.key;
                            const dirty = dirtySections.has(item.key);
                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => {
                                        setActiveSection(item.key);
                                        setResetConfirmation(null);
                                    }}
                                    className={`flex min-w-44 items-center gap-3 border-l-2 px-3 py-3 text-left transition-colors lg:w-full ${active
                                        ? 'border-[var(--cinnabar)] bg-white text-stone-900'
                                        : 'border-transparent text-stone-500 hover:bg-white/70 hover:text-stone-800'
                                        }`}
                                >
                                    <item.icon className="size-4 shrink-0" aria-hidden="true" />
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-medium">{item.label}</span>
                                        <span className="mt-0.5 hidden text-[11px] text-stone-400 lg:block">{item.description}</span>
                                    </span>
                                    {dirty && <span className="size-1.5 shrink-0 rounded-full bg-[var(--cinnabar)]" aria-label="有未保存修改" />}
                                </button>
                            );
                        })}
                    </nav>

                    <section className="min-w-0 p-5 sm:p-7 lg:p-9">
                        {currentFeedback && (
                            <div className={`mb-6 flex items-start gap-3 border-l-2 px-4 py-3 text-sm ${currentFeedback.type === 'success'
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                                : currentFeedback.type === 'error'
                                    ? 'border-red-600 bg-red-50 text-red-700'
                                    : 'border-stone-500 bg-stone-100 text-stone-700'
                                }`}>
                                {currentFeedback.type === 'success'
                                    ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                    : <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
                                <span>{currentFeedback.message}</span>
                            </div>
                        )}

                        {activeSection === 'site' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="font-song text-2xl font-semibold text-stone-900">站点内容</h2>
                                    <p className="mt-2 text-sm text-stone-500">这些文字会直接显示在前台首页和页脚。</p>
                                </div>
                                <div className="grid gap-5 md:grid-cols-2">
                                    <Field label="站点名称" hint={`${draft.site.siteTitle.length}/40`}>
                                        <Input value={draft.site.siteTitle} onChange={(event) => setDraft({ ...draft, site: { ...draft.site, siteTitle: event.target.value } })} />
                                    </Field>
                                    <Field label="首页眉题" hint={`${draft.site.homeEyebrow.length}/40`}>
                                        <Input value={draft.site.homeEyebrow} onChange={(event) => setDraft({ ...draft, site: { ...draft.site, homeEyebrow: event.target.value } })} />
                                    </Field>
                                </div>
                                <Field label="首页引导语" hint={`${draft.site.homeSubtitle.length}/180`}>
                                    <TextArea value={draft.site.homeSubtitle} onChange={(value) => setDraft({ ...draft, site: { ...draft.site, homeSubtitle: value } })} />
                                </Field>
                                <Field label="问卦须知" hint={`${draft.site.divinationNotice.length}/100`}>
                                    <Input value={draft.site.divinationNotice} onChange={(event) => setDraft({ ...draft, site: { ...draft.site, divinationNotice: event.target.value } })} />
                                </Field>
                                <div className="border-y border-stone-200">
                                    <ToggleRow
                                        title="首页公告"
                                        description="启用后，在起卦区域上方显示一条站点公告。"
                                        checked={draft.site.announcementEnabled}
                                        onChange={(checked) => setDraft({ ...draft, site: { ...draft.site, announcementEnabled: checked } })}
                                    />
                                </div>
                                {draft.site.announcementEnabled && (
                                    <Field label="公告内容" hint={`${draft.site.announcementText.length}/240`}>
                                        <TextArea value={draft.site.announcementText} onChange={(value) => setDraft({ ...draft, site: { ...draft.site, announcementText: value } })} />
                                    </Field>
                                )}
                                <div className="grid gap-5 md:grid-cols-2">
                                    <Field label="页脚文字" hint={`${draft.site.footerText.length}/80`}>
                                        <Input value={draft.site.footerText} onChange={(event) => setDraft({ ...draft, site: { ...draft.site, footerText: event.target.value } })} />
                                    </Field>
                                    <Field label="免责声明" hint={`${draft.site.disclaimerText.length}/300`}>
                                        <TextArea rows={3} value={draft.site.disclaimerText} onChange={(value) => setDraft({ ...draft, site: { ...draft.site, disclaimerText: value } })} />
                                    </Field>
                                </div>
                            </div>
                        )}

                        {activeSection === 'divination' && (
                            <div className="space-y-7">
                                <div>
                                    <h2 className="font-song text-2xl font-semibold text-stone-900">起卦规则</h2>
                                    <p className="mt-2 text-sm text-stone-500">控制前台允许使用的起卦方式与解卦入口。</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-stone-800">启用的起卦方式</p>
                                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                        {(Object.keys(METHOD_LABELS) as DivinationMethod[]).map((method) => {
                                            const enabled = draft.divination.enabledMethods.includes(method);
                                            return (
                                                <button
                                                    key={method}
                                                    type="button"
                                                    aria-pressed={enabled}
                                                    onClick={() => toggleMethod(method)}
                                                    className={`border px-4 py-3 text-sm transition-colors ${enabled
                                                        ? 'border-[var(--cinnabar)] bg-[#f8efeb] text-stone-900'
                                                        : 'border-stone-200 bg-white text-stone-400'
                                                        }`}
                                                >
                                                    {METHOD_LABELS[method]}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <Field label="默认起卦方式">
                                    <select
                                        value={draft.divination.defaultMethod}
                                        onChange={(event) => setDraft({
                                            ...draft,
                                            divination: { ...draft.divination, defaultMethod: event.target.value as DivinationMethod },
                                        })}
                                        className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-800 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-300/50"
                                    >
                                        {draft.divination.enabledMethods.map((method) => (
                                            <option key={method} value={method}>{METHOD_LABELS[method]}</option>
                                        ))}
                                    </select>
                                </Field>
                                <div className="border-y border-stone-200">
                                    <ToggleRow
                                        title="开放 AI 解卦"
                                        description="关闭后仍可起卦和查看卦象，但不能请求 AI 解读。"
                                        checked={draft.divination.aiInterpretationEnabled}
                                        onChange={(checked) => setDraft({ ...draft, divination: { ...draft.divination, aiInterpretationEnabled: checked } })}
                                    />
                                    <ToggleRow
                                        title="允许访客使用自己的 API"
                                        description="关闭后前台不显示 API 设置入口，服务端也会拒绝访客自定义配置。"
                                        checked={draft.divination.allowCustomAi}
                                        onChange={(checked) => setDraft({ ...draft, divination: { ...draft.divination, allowCustomAi: checked } })}
                                    />
                                </div>
                                <Field label="问题最大字数" hint="50 至 500">
                                    <Input
                                        type="number"
                                        min={50}
                                        max={500}
                                        value={draft.divination.maxQuestionLength}
                                        onChange={(event) => setDraft({
                                            ...draft,
                                            divination: { ...draft.divination, maxQuestionLength: Number(event.target.value) },
                                        })}
                                    />
                                </Field>
                            </div>
                        )}

                        {activeSection === 'interpretation' && (
                            <div className="space-y-7">
                                <div>
                                    <h2 className="font-song text-2xl font-semibold text-stone-900">AI 解读偏好</h2>
                                    <p className="mt-2 text-sm text-stone-500">以安全预设调整输出，不开放完整系统提示词。</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-stone-800">解读详略</p>
                                    <div className="mt-3 grid gap-2 md:grid-cols-3">
                                        <ChoiceButton selected={draft.interpretation.detailLevel === 'concise'} title="精简" description="约 350 至 550 字，保留核心判断。" onClick={() => setDraft({ ...draft, interpretation: { ...draft.interpretation, detailLevel: 'concise' } })} />
                                        <ChoiceButton selected={draft.interpretation.detailLevel === 'standard'} title="标准" description="约 650 至 900 字，完整但不重复。" onClick={() => setDraft({ ...draft, interpretation: { ...draft.interpretation, detailLevel: 'standard' } })} />
                                        <ChoiceButton selected={draft.interpretation.detailLevel === 'detailed'} title="详解" description="约 900 至 1300 字，深入展开卦理。" onClick={() => setDraft({ ...draft, interpretation: { ...draft.interpretation, detailLevel: 'detailed' } })} />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-stone-800">行文风格</p>
                                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                                        <ChoiceButton selected={draft.interpretation.tone === 'plain'} title="通俗清楚" description="现代中文表达，术语出现后直接解释。" onClick={() => setDraft({ ...draft, interpretation: { ...draft.interpretation, tone: 'plain' } })} />
                                        <ChoiceButton selected={draft.interpretation.tone === 'classical'} title="古朴沉稳" description="半文半白、有传统气质，但保持易读。" onClick={() => setDraft({ ...draft, interpretation: { ...draft.interpretation, tone: 'classical' } })} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'limits' && (
                            <div className="space-y-7">
                                <div>
                                    <h2 className="font-song text-2xl font-semibold text-stone-900">使用额度</h2>
                                    <p className="mt-2 text-sm text-stone-500">限制只作用于 AI 解卦，用于控制服务成本和异常请求。</p>
                                </div>
                                <div className="grid gap-5 md:grid-cols-2">
                                    <Field label="单个访客每 10 分钟" hint="1 至 100">
                                        <Input type="number" min={1} max={100} value={draft.limits.userPerTenMinutes} onChange={(event) => setDraft({ ...draft, limits: { ...draft.limits, userPerTenMinutes: Number(event.target.value) } })} />
                                    </Field>
                                    <Field label="单个访客每日" hint="1 至 1000">
                                        <Input type="number" min={1} max={1000} value={draft.limits.userDaily} onChange={(event) => setDraft({ ...draft, limits: { ...draft.limits, userDaily: Number(event.target.value) } })} />
                                    </Field>
                                    <Field label="单个 IP 每 10 分钟" hint="1 至 1000">
                                        <Input type="number" min={1} max={1000} value={draft.limits.ipPerTenMinutes} onChange={(event) => setDraft({ ...draft, limits: { ...draft.limits, ipPerTenMinutes: Number(event.target.value) } })} />
                                    </Field>
                                    <Field label="全站每日" hint="1 至 100000">
                                        <Input type="number" min={1} max={100000} value={draft.limits.globalDaily} onChange={(event) => setDraft({ ...draft, limits: { ...draft.limits, globalDaily: Number(event.target.value) } })} />
                                    </Field>
                                </div>
                                <Field label="达到额度后的提示" hint={`${draft.limits.limitMessage.length}/120`}>
                                    <Input value={draft.limits.limitMessage} onChange={(event) => setDraft({ ...draft, limits: { ...draft.limits, limitMessage: event.target.value } })} />
                                </Field>
                            </div>
                        )}

                        {activeSection === 'aiProvider' && (
                            <div className="space-y-7">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <h2 className="font-song text-2xl font-semibold text-stone-900">API 服务</h2>
                                        <p className="mt-2 text-sm text-stone-500">后台配置保存后优先于环境变量，无需重新部署。</p>
                                    </div>
                                    <span className="border border-stone-300 bg-white px-3 py-1 text-xs text-stone-600">
                                        当前来源：{draft.aiProvider.source === 'database' ? '后台配置' : '环境变量'}
                                    </span>
                                </div>
                                {draft.aiProvider.apiKeyStatus === 'invalid' && (
                                    <div className="border-l-2 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        当前密钥无法解密，请填写新的 API Key 并保存。
                                    </div>
                                )}
                                <Field label="API 地址" hint="必须使用标准 HTTPS 地址">
                                    <Input type="url" value={draft.aiProvider.baseUrl} onChange={(event) => setDraft({ ...draft, aiProvider: { ...draft.aiProvider, baseUrl: event.target.value } })} />
                                </Field>
                                <Field label="模型名称">
                                    <Input value={draft.aiProvider.model} onChange={(event) => setDraft({ ...draft, aiProvider: { ...draft.aiProvider, model: event.target.value } })} />
                                </Field>
                                <Field label="API Key" hint={aiBaseUrlChanged ? '更换地址后必须重新填写' : apiKeyHint}>
                                    <Input type="password" autoComplete="new-password" value={apiKey} placeholder={hasStoredApiKey ? '••••••••••••••••' : undefined} onChange={(event) => setApiKey(event.target.value)} />
                                    {aiBaseUrlChanged && !apiKey.trim() && (
                                        <span className="block text-xs leading-5 text-red-600">
                                            API 地址已更改，请填写该地址对应的新密钥。
                                        </span>
                                    )}
                                </Field>
                                <div className="border-l-2 border-stone-300 bg-stone-100/70 px-4 py-3 text-xs leading-6 text-stone-600">
                                    API Key 使用 AES-256-GCM 加密后存入数据库，接口不会返回明文。更换管理员 Session 密钥后，需要重新保存这里的 API Key。
                                </div>
                                <Button type="button" variant="outline" onClick={handleTestAi} disabled={testingAi}>
                                    <TestTube2 aria-hidden="true" />
                                    {testingAi ? '测试中…' : '测试当前配置'}
                                </Button>
                            </div>
                        )}

                        <footer className="mt-10 flex flex-col gap-4 border-t border-stone-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs text-stone-400">
                                {formatUpdatedAt(draft.updatedAt[activeSection], activeSection)}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant={resetConfirmation === activeSection ? 'destructive' : 'outline'}
                                    onClick={() => handleReset(activeSection)}
                                    disabled={savingSection === activeSection}
                                >
                                    <RotateCcw aria-hidden="true" />
                                    {resetConfirmation === activeSection ? '确认恢复' : '恢复默认'}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => handleSave(activeSection)}
                                    disabled={!dirtySections.has(activeSection) || savingSection === activeSection}
                                >
                                    <Save aria-hidden="true" />
                                    {savingSection === activeSection ? '保存中…' : '保存修改'}
                                </Button>
                            </div>
                        </footer>
                    </section>
                </div>
            </div>
        </div>
    );
}

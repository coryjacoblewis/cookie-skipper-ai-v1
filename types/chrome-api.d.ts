// A minimal set of Chrome API type definitions to satisfy the compiler.
// This is not exhaustive but covers the usage in this project.
// It supports both callback-style and promise-style async operations where applicable.

declare namespace chrome {
    namespace runtime {
        const id: string | undefined;
        const lastError: { message?: string } | undefined;

        function getURL(path: string): string;
        function openOptionsPage(): void;

        function sendMessage(message: any, responseCallback?: (response: any) => void): void;
        function sendMessage(extensionId: string, message: any, options?: object, responseCallback?: (response: any) => void): void;

        const onMessage: {
            addListener(callback: (message: any, sender: MessageSender, sendResponse: (response?: any) => void) => boolean | void | Promise<any>): void;
            removeListener(callback: Function): void;
        };

        const onInstalled: {
            addListener(callback: (details: { reason: 'install' | 'update' | 'chrome_update' }) => void): void;
        };

        interface MessageSender {
            tab?: tabs.Tab;
            id?: string;
            url?: string;
        }
    }

    namespace storage {
        interface StorageChange {
            oldValue?: any;
            newValue?: any;
        }

        interface StorageArea {
            get(keys: string | string[] | { [key: string]: any } | null, callback: (items: { [key: string]: any }) => void): void;
            set(items: { [key: string]: any }, callback?: () => void): void;
            remove(keys: string | string[], callback?: () => void): void;
        }
        const sync: StorageArea;
        const session: StorageArea;
        const onChanged: {
            addListener(callback: (changes: { [key: string]: StorageChange }, areaName: 'sync' | 'local' | 'managed' | 'session') => void): void;
        }
    }

    namespace tabs {
        interface Tab {
            id?: number;
            url?: string;
            index: number;
            windowId: number;
            openerTabId?: number;
            selected: boolean;
            highlighted: boolean;
            active: boolean;
            pinned: boolean;
            audible?: boolean;
            discarded: boolean;
            autoDiscardable: boolean;
            mutedInfo?: { muted: boolean };
            width?: number;
            height?: number;
            sessionId?: string;
            incognito: boolean;
            status?: 'loading' | 'complete';
            title?: string;
            favIconUrl?: string;
        }

        function query(queryInfo: { active?: boolean, currentWindow?: boolean, url?: string | string[], title?: string }): Promise<Tab[]>;
        function sendMessage(tabId: number, message: any, responseCallback?: (response: any) => void): void;

        const onUpdated: {
            addListener(callback: (tabId: number, changeInfo: { status?: 'loading' | 'complete' | 'unloaded', url?: string }, tab: Tab) => void): void;
        }
        const onRemoved: {
            addListener(callback: (tabId: number, removeInfo: { windowId: number, isWindowClosing: boolean }) => void): void;
        }
    }

    namespace scripting {
        interface InjectionResult {
            result: any;
        }
        function executeScript(injection: { target: { tabId: number }, func: (...args: any[]) => any, args?: any[] }, callback?: (results: InjectionResult[]) => void): Promise<InjectionResult[]>;
    }

    namespace action {
        const onClicked: {
            addListener(callback: (tab: tabs.Tab) => void): void;
        };
    }
    
    namespace payments {
        function buy(parameters: {
            sku: string;
            success: () => void;
            failure: (error: any) => void;
        }): void;
    }
}

// Type definition to support `import.meta.env` which is used for development overrides
// and is populated by build tools like Vite. This resolves TypeScript errors about 'env'
// not existing on `ImportMeta`.
interface ImportMeta {
    readonly env: {
        readonly DEV: boolean;
        readonly VITE_CENTRAL_API_KEY?: string;
    };
}

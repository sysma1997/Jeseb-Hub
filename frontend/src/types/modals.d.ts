declare global {
    interface Window {
        showAlert: (message: string, title: string = "Warning", 
            okAction?: () => void) => void;
        showConfirm: (message: string, title: string = "Warning", 
            yesAction?: () => void, noAction?: () => void) => void;
        showPrompt: (message: string, title: string = "Warning", 
            acceptAction?: (value: string) => void, cancelAction?: () => void) => void;
    }
}

export {};
declare global {
    interface Window {
        showAlert: (message: string, title: string = "Warning", okAction?: () => void) => void;
        showConfirm: (message: string, title: string = "Warning", yesAction?: () => void) => void;
        showPrompt: (message: string, title: string = "Warning", acceptAction?: (value: string) => void) => void;
    }
}

export {};
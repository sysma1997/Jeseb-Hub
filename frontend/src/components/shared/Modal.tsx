import { useEffect, type ReactNode } from "react";

import { t } from "../../core/shared/infrastructure/i18n";

import "../../styles/shared/modal.css";

export const Modal = (props: {
    title: string;
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    footer?: ReactNode;
    size?: "default" | "wide";
}) => {
    const { title, open, onClose, children, footer, size = "default" } = props;

    useEffect(() => {
        if (!open) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            // si hay otro modal abierto encima (por ejemplo, una confirmacion),
            // Escape debe cerrar solo ese y no el modal que queda detras
            if (document.querySelectorAll(".modal-overlay.is-active").length > 1) return;

            onClose();
        };
        document.addEventListener("keydown", onKeyDown);

        return () => document.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    // inert evita que se pueda enfocar con el teclado el contenido del modal
    // mientras esta cerrado, ya que el overlay sigue en el DOM para animarse
    return <div className={`modal-overlay${open ? " is-active" : ""}`} inert={!open}
        role="dialog" aria-modal="true" aria-label={title} aria-hidden={!open}>
        <div className={`modal-dialog${size === "wide" ? " is-wide" : ""}`}>
            <div className="modal-header">
                <h3>{title}</h3>
                <button type="button" className="modal-close" 
                    aria-label={t("shared.close")} onClick={onClose}>&times;</button>
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
        </div>
    </div>;
};

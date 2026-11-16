import { useEffect, useRef, useState, type FormEvent } from "react";
import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";
import { v4 as Uuid } from "uuid";

import { Debt } from "../../core/debt/domain/Debt";
import type { DebtRepository } from "../../core/debt/domain/DebtRepository";
import { DebtApiRepository } from "../../core/debt/infrastructure/DebtApiRepository";

import { MessageBuilder } from "../../core/shared/domain/MessageBuilder";
import { Money } from "../../core/shared/domain/Money";
import { FormatNumber } from "../../core/shared/domain/FormatNumber";
import { Attach, Detach, Notify } from "../../core/shared/domain/Subject";
import { t } from "../../core/shared/infrastructure/i18n";

import { Modal } from "../shared/Modal";

import "../../styles/debts/form.css";

dayjs.extend(dayjsUtc);

const repository: DebtRepository = new DebtApiRepository();

export const Form = () => {
    const [open, setOpen] = useState<boolean>(false);
    const [editing, setEditing] = useState<Debt | undefined>(undefined);
    const [saving, setSaving] = useState<boolean>(false);
    const personRef = useRef<HTMLInputElement>(null);

    const [person, setPerson] = useState<string>("");
    const [type, setType] = useState<boolean>(true);
    const [amount, setAmount] = useState<string>("");
    const [date, setDate] = useState<string>("");
    const [dueDate, setDueDate] = useState<string>("");
    const [description, setDescription] = useState<string>("");

    const reset = () => {
        setEditing(undefined);
        setPerson("");
        setType(true);
        setAmount("");
        setDate(dayjs().format("YYYY-MM-DD"));
        setDueDate("");
        setDescription("");
        setSaving(false);
    };

    useEffect(() => {
        const openAdd = () => {
            reset();
            setOpen(true);
        };
        const openUpdate = (debt: Debt) => {
            setEditing(debt);
            setPerson(debt.person);
            setType(debt.type);
            setAmount(debt.amount.toString());
            setDate(dayjs(debt.date).format("YYYY-MM-DD"));
            setDueDate(debt.dueDate ? dayjs(debt.dueDate).format("YYYY-MM-DD") : "");
            setDescription(debt.description ?? "");
            setSaving(false);
            setOpen(true);
        };

        Attach("sidebar:add", openAdd);
        Attach("debt:add:request", openAdd);
        Attach("debt:update:request", openUpdate);
        return () => {
            Detach("sidebar:add", openAdd);
            Detach("debt:add:request", openAdd);
            Detach("debt:update:request", openUpdate);
        };
    }, []);

    useEffect(() => {
        if (open) personRef.current?.focus();
    }, [open]);

    const close = () => {
        if (saving) return;
        setOpen(false);
    };

    const submit = async (event: FormEvent) => {
        event.preventDefault();

        const title: string = t(editing ? "debt.update.title" : "debt.add.title");
        const messages = new MessageBuilder();

        const personValue: string = person.trim();
        if (!personValue) messages.add(t("debt.personRequired"));

        let amountCents: number = 0;
        if (!amount.trim()) messages.add(t("debt.amountRequired"));
        else {
            try {
                amountCents = Money.toCents(amount);
                if (amountCents <= 0) messages.add(t("debt.amountRequired"));
            } catch {
                messages.add(t("debt.amountRequired"));
            }
        }

        if (!date) messages.add(t("debt.dateRequired"));
        if (date && dueDate && dayjs(dueDate).isBefore(dayjs(date), "day"))
            messages.add(t("debt.dueDateBeforeDate"));

        if (editing && amountCents > 0 && amountCents < Money.toCents(editing.paidAmount))
            messages.add(t("debt.amountBelowPaid", {
                paid: FormatNumber(editing.paidAmount)
            }));

        if (messages.toString()) {
            window.showAlert(messages.toString(), title);
            return;
        }

        setSaving(true);
        try {
            const debt = new Debt(personValue, type, Money.fromCents(amountCents),
                dayjs(date).toDate(),
                editing?.id ?? Uuid(), editing?.idUser,
                description.trim() || undefined,
                dueDate ? dayjs(dueDate).toDate() : undefined,
                editing?.paidAmount ?? 0, editing?.paymentCount ?? 0);

            if (editing) await repository.update(debt);
            else await repository.add(debt);

            setOpen(false);
            Notify("debt:changed");
            window.showAlert(t(editing ? "debt.update.response" : "debt.add.response"), title);
        } catch (err: any) {
            if (err instanceof Error) {
                console.error(err);
                window.showAlert(err.message, title);
            }
        } finally {
            setSaving(false);
        }
    };

    return <Modal title={t(editing ? "debt.update.title" : "debt.add.title")}
        open={open} onClose={close} size="wide"
        footer={<>
            <button type="button" className="btn-danger" onClick={close} disabled={saving}>
                {t("shared.cancel")}
            </button>
            <button type="submit" form="debtForm" className="btn-primary" disabled={saving}>
                {saving ? t("shared.saving") : t(editing ? "shared.update" : "shared.add")}
            </button>
        </>}>
        <form id="debtForm" className="debtForm" onSubmit={submit}>
            <div className="field debtFormPerson">
                <label className="label" htmlFor="debtFormPerson">{t("debt.person")}: *</label>
                <input id="debtFormPerson" className="input" type="text" ref={personRef}
                    value={person} onChange={e => setPerson(e.target.value)} />
            </div>

            <div className="field debtFormType">
                <label className="label" htmlFor="debtFormType">{t("debt.type")}: *</label>
                <select id="debtFormType" value={type ? "true" : "false"}
                    disabled={Boolean(editing && editing.paymentCount > 0)}
                    onChange={e => setType(e.target.value === "true")}>
                    <option value="true">{t("debt.typeReceivable")}</option>
                    <option value="false">{t("debt.typePayable")}</option>
                </select>
            </div>
            {editing && editing.paymentCount > 0 &&
                <p className="debtFormHint debtFormTypeHint">{t("debt.typeLockedAfterPayment")}</p>}

            <div className="field debtFormAmount">
                <label className="label" htmlFor="debtFormAmount">{t("debt.amount")}: *</label>
                <input id="debtFormAmount" className="input" type="number" min="0.01" step="0.01"
                    inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>

            <div className="debtFormDates debtFormDatesGroup">
                <div className="field">
                    <label className="label" htmlFor="debtFormDate">{t("debt.date")}:</label>
                    <input id="debtFormDate" className="input" type="date"
                        value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div className="field">
                    <label className="label" htmlFor="debtFormDueDate">{t("debt.dueDate")}:</label>
                    <input id="debtFormDueDate" className="input" type="date"
                        value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
            </div>

            <div className="field debtFormDescription">
                <label className="label" htmlFor="debtFormDescription">{t("debt.description")}:</label>
                <textarea id="debtFormDescription" className="textarea"
                    value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <p className="debtFormHint debtFormMandatory">{t("debt.mandatory")}</p>
        </form>
    </Modal>;
};

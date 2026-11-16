import { useEffect, useState, type FormEvent } from "react";
import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";
import { Icon } from "@iconify/react";
import { v4 as Uuid } from "uuid";

import { Debt } from "../../core/debt/domain/Debt";
import { DebtPayment } from "../../core/debt/domain/DebtPayment";
import type { DebtRepository } from "../../core/debt/domain/DebtRepository";
import { DebtApiRepository } from "../../core/debt/infrastructure/DebtApiRepository";
import { Account } from "../../core/account/domain/Account";
import { AccountApiRepository } from "../../core/account/infrastructure/AccountApiRepository";
import { Category } from "../../core/category/domain/Category";
import { CategoryApiRepository } from "../../core/category/infrastructure/CategoryApiRepository";

import { Pagination } from "../../core/shared/domain/Pagination";
import { FormatNumber } from "../../core/shared/domain/FormatNumber";
import { MessageBuilder } from "../../core/shared/domain/MessageBuilder";
import { Money } from "../../core/shared/domain/Money";
import { Attach, Detach, Notify } from "../../core/shared/domain/Subject";
import { t } from "../../core/shared/infrastructure/i18n";

import { Modal } from "../shared/Modal";
import { Pagination as CPagination } from "../shared/Pagination";

import "../../styles/debts/detail.css";

dayjs.extend(dayjsUtc);

const repository: DebtRepository = new DebtApiRepository();
const accountRepository = new AccountApiRepository();
const categoryRepository = new CategoryApiRepository();

const statusLabel = (debt: Debt): string => {
  if (debt.status === "paid") return t("debt.statusPaid");
  if (debt.status === "overdue") return t("debt.statusOverdue");

  return t("debt.statusPending");
};

export const Detail = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [debt, setDebt] = useState<Debt | undefined>(undefined);

  const [payments, setPayments] = useState<Pagination<DebtPayment>>(
    new Pagination(),
  );
  const [limit, setLimit] = useState<number>(15);
  const [page, setPage] = useState<number>(1);
  const [refresh, setRefresh] = useState<number>(0);

  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [idAccount, setIdAccount] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [choicesLoading, setChoicesLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    const loadAccounts = async (): Promise<Account[]> => {
      const all: Account[] = [];
      let page = 1;
      let pages = 1;
      do {
        const result = await accountRepository.getList(100, page);
        all.push(...result.list);
        pages = result.pages;
        page++;
      } while (page <= pages);
      return all;
    };
    const loadCategories = async (): Promise<Category[]> => {
      const all: Category[] = [];
      let page = 1;
      let pages = 1;
      do {
        const result = await categoryRepository.getList(100, page);
        all.push(...result.list);
        pages = result.pages;
        page++;
      } while (page <= pages);
      return all;
    };

    loadAccounts()
      .then((accountList) => {
        if (!active) return;
        setAccounts(accountList);
        setIdAccount((current) => current || accountList[0]?.id || "");
      })
      .catch((err: any) => {
        if (active && err instanceof Error) {
          console.error(err);
          window.showAlert(err.message);
        }
      })
      .finally(() => {
        if (active) setChoicesLoading(false);
      });
    // La categoria es opcional: si la carga falla, no debe bloquear los abonos.
    loadCategories()
      .then((categoryList) => {
        if (active) setCategories(categoryList);
      })
      .catch((err: any) => {
        if (active && err instanceof Error) {
          console.error(err);
          window.showAlert(err.message);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const show = (selected: Debt) => {
      setDebt(selected);
      setPayments(new Pagination());
      setLimit(15);
      setPage(1);
      setAmount("");
      setIdAccount(accounts[0]?.id ?? "");
      setCategory("");
      setDate(dayjs().format("YYYY-MM-DDTHH:mm"));
      setDescription("");
      setSaving(false);
      setOpen(true);
    };

    Attach("debt:show", show);
    return () => Detach("debt:show", show);
  }, [accounts]);

  useEffect(() => {
    if (!open || !debt?.id) return;

    let active = true;
    repository
      .getPayments(debt.id, limit, page)
      .then((data: Pagination<DebtPayment>) => {
        if (active) setPayments(data);
      })
      .catch((err: any) => {
        if (!active) return;
        if (err instanceof Error) {
          console.error(err);
          window.showAlert(err.message);
        }
      });

    return () => {
      active = false;
    };
  }, [open, debt?.id, limit, page, refresh]);

  const close = () => {
    if (saving) return;
    setOpen(false);
  };

  const reloadDebt = async (id: string) => {
    const updated: Debt = await repository.get(id);
    setDebt(updated);
  };

  const addPayment = async (event: FormEvent) => {
    event.preventDefault();
    if (!debt?.id) return;

    const title: string = t("debt.detail.title");
    const messages = new MessageBuilder();

    let amountCents: number = 0;
    if (!amount.trim()) messages.add(t("debt.detail.paymentAmountRequired"));
    else {
      try {
        amountCents = Money.toCents(amount);
        if (amountCents <= 0)
          messages.add(t("debt.detail.paymentAmountRequired"));
      } catch {
        messages.add(t("debt.detail.paymentAmountRequired"));
      }
    }

    if (!date) messages.add(t("debt.detail.paymentDateRequired"));
    const account = accounts.find((item) => item.id === idAccount);
    if (!idAccount || !account)
      messages.add(t("debt.detail.paymentAccountRequired"));

    if (amountCents > 0 && amountCents > Money.toCents(debt.pendingAmount))
      messages.add(
        t("debt.detail.paymentExceedsPending", {
          pending: FormatNumber(debt.pendingAmount),
        }),
      );
    if (
      debt.type === false &&
      account &&
      amountCents > Money.toCents(account.balance)
    )
      messages.add(t("debt.detail.paymentInsufficientBalance"));

    if (messages.toString()) {
      window.showAlert(messages.toString(), title);
      return;
    }

    setSaving(true);
    try {
      const payment = new DebtPayment(
        dayjs(date).toDate(),
        Money.fromCents(amountCents),
        debt.id,
        Uuid(),
        undefined,
        description.trim() || undefined,
        undefined,
        idAccount,
        account?.name,
        category || undefined,
      );

      await repository.addPayment(payment);
      await reloadDebt(debt.id);

      setAmount("");
      setCategory("");
      setDescription("");
      setDate(dayjs().format("YYYY-MM-DDTHH:mm"));
      setRefresh((value) => value + 1);
      Notify("debt:changed");

      window.showAlert(t("debt.detail.paymentAdded"), title);
    } catch (err: any) {
      if (err instanceof Error) {
        console.error(err);
        window.showAlert(err.message, title);
      }
    } finally {
      setSaving(false);
    }
  };

  const deletePayment = (payment: DebtPayment) => {
    if (!debt?.id || !payment.id) return;

    window.showConfirm(
      t("debt.detail.deletePayment.confirm"),
      t("debt.detail.deletePayment.title"),
      async () => {
        try {
          await repository.deletePayment(debt.id!, payment.id!);
          await reloadDebt(debt.id!);

          if (payments.list.length === 1 && payments.pages > 1 && page > 1)
            setPage(page - 1);
          setRefresh((value) => value + 1);
          Notify("debt:changed");

          window.showAlert(
            t("debt.detail.deletePayment.response"),
            t("debt.detail.deletePayment.title"),
          );
        } catch (err: any) {
          if (err instanceof Error) {
            console.error(err);
            window.showAlert(err.message);
          }
        }
      },
    );
  };

  const onChangePagination = (limit: number, page: number) => {
    setLimit(limit);
    setPage(page);
  };

  let paidPercent: number = 0;
  if (debt) {
    const amountCents: number = Money.toCents(debt.amount);
    const paidCents: number = Money.toCents(debt.paidAmount);

    if (amountCents > 0)
      paidPercent = Math.min(100, Math.round((paidCents / amountCents) * 100));
  }

  return (
    <Modal
      title={t("debt.detail.title")}
      open={open}
      onClose={close}
      size="wide"
      footer={
        <button type="button" className="btn-primary" onClick={close}>
          {t("shared.close")}
        </button>
      }
    >
      {debt && (
        <>
          <div className="debtDetailBadges">
            <span
              className={`debtsTypeBadge ${debt.type ? "receivable" : "payable"}`}
            >
              {debt.type ? t("debt.typeReceivable") : t("debt.typePayable")}
            </span>
            <span className={`debtsStatusBadge ${debt.status}`}>
              {statusLabel(debt)}
            </span>
          </div>

          <div className="debtDetailGrid">
            <div className="debtDetailItem">
              <span className="debtDetailLabel">{t("debt.person")}</span>
              <span className="debtDetailValue">{debt.person}</span>
            </div>
            <div className="debtDetailItem">
              <span className="debtDetailLabel">{t("debt.detail.amount")}</span>
              <span className="debtDetailValue">
                {FormatNumber(debt.amount)}
              </span>
            </div>
            <div className="debtDetailItem">
              <span className="debtDetailLabel">
                {t("debt.detail.paidAmount")}
              </span>
              <span className="debtDetailValue paid">
                {FormatNumber(debt.paidAmount)}
              </span>
            </div>
            <div className="debtDetailItem">
              <span className="debtDetailLabel">
                {t("debt.detail.pendingAmount")}
              </span>
              <span className="debtDetailValue pending">
                {FormatNumber(debt.pendingAmount)}
              </span>
            </div>
            <div className="debtDetailItem">
              <span className="debtDetailLabel">{t("debt.date")}</span>
              <span className="debtDetailValue">
                {dayjs(debt.date).format("DD/MM/YYYY")}
              </span>
            </div>
            <div className="debtDetailItem">
              <span className="debtDetailLabel">{t("debt.dueDate")}</span>
              <span className="debtDetailValue">
                {debt.dueDate
                  ? dayjs(debt.dueDate).format("DD/MM/YYYY")
                  : t("debt.detail.noDueDate")}
              </span>
            </div>
          </div>

          {debt.description && (
            <div className="debtDetailItem full">
              <span className="debtDetailLabel">{t("debt.description")}</span>
              <span className="debtDetailValue description">
                {debt.description}
              </span>
            </div>
          )}

          <div
            className="debtProgress"
            role="progressbar"
            aria-valuenow={paidPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("debt.detail.progress", { percent: paidPercent })}
          >
            <div
              className="debtProgressBar"
              style={{ width: `${paidPercent}%` }}
            />
          </div>
          <p className="debtProgressLabel">
            {t("debt.detail.progress", { percent: paidPercent })}
          </p>

          <section className="debtPayments" aria-labelledby="debtPaymentsTitle">
            <h4 id="debtPaymentsTitle">{t("debt.detail.payments")}</h4>

            {debt.status !== "paid" && (
              <form className="debtPaymentForm" onSubmit={addPayment}>
                <div className="debtPaymentFields">
                  <div className="field">
                    <label className="label" htmlFor="debtPaymentAmount">
                      {t("debt.detail.paymentAmount")}:
                    </label>
                    <input
                      id="debtPaymentAmount"
                      className="input"
                      type="number"
                      min="0.01"
                      step="0.01"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="debtPaymentDate">
                      {t("debt.detail.paymentDate")}:
                    </label>
                    <input
                      id="debtPaymentDate"
                      className="input"
                      type="datetime-local"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="debtPaymentAccount">
                      {t("debt.detail.paymentAccount")}:
                    </label>
                    <select
                      id="debtPaymentAccount"
                      className="input"
                      value={idAccount}
                      onChange={(e) => setIdAccount(e.target.value)}
                      disabled={choicesLoading || accounts.length === 0}
                    >
                      <option value="">
                        {choicesLoading
                          ? t("debt.detail.loadingAccounts")
                          : t("debt.detail.selectAccount")}
                      </option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} — {FormatNumber(account.balance)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="debtPaymentCategory">
                      {t("debt.detail.paymentCategory")}:
                    </label>
                    <select
                      id="debtPaymentCategory"
                      className="input"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="">{t("debt.detail.noCategory")}</option>
                      {categories.map((item) => (
                        <option key={item.id} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="debtPaymentDescription">
                      {t("debt.detail.paymentDescription")}:
                    </label>
                    <input
                      id="debtPaymentDescription"
                      className="input"
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
                {accounts.length === 0 && !choicesLoading && (
                  <p className="debtPaymentNotice">
                    {t("debt.detail.noAccounts")}
                  </p>
                )}
                <button
                  type="submit"
                  className="btn-primary debtPaymentAdd"
                  disabled={saving || choicesLoading || accounts.length === 0}
                >
                  {saving ? t("shared.saving") : t("debt.detail.addPayment")}
                </button>
              </form>
            )}

            {payments.list.length === 0 && (
              <p className="debtPaymentsEmpty">{t("debt.detail.noPayments")}</p>
            )}

            {payments.list.length > 0 && (
              <>
                <table className="debtPaymentsTable">
                  <thead>
                    <tr>
                      <th>{t("debt.detail.paymentDate")}</th>
                      <th style={{ textAlign: "right" }}>{t("debt.amount")}</th>
                      <th>{t("debt.detail.paymentAccount")}</th>
                      <th>{t("debt.description")}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.list.map((payment: DebtPayment) => (
                      <tr key={payment.id}>
                        <td>
                          {dayjs(payment.date).format("DD/MM/YYYY HH:mm")}
                        </td>
                        <td className="debtPaymentAmount">
                          {FormatNumber(payment.amount)}
                        </td>
                        <td className="debtPaymentAccount">
                          <span>
                            {payment.account ?? t("debt.detail.legacyPayment")}
                          </span>
                          {payment.category && (
                            <small>{payment.category}</small>
                          )}
                        </td>
                        <td className="debtPaymentDescription">
                          {payment.description ?? "—"}
                        </td>
                        <td className="debtPaymentActions">
                          <button
                            type="button"
                            className="btnDelete"
                            aria-label={t("debt.detail.deletePayment.title")}
                            title={t("debt.detail.deletePayment.title")}
                            onClick={() => deletePayment(payment)}
                          >
                            <Icon icon="solar:trash-bin-2-bold" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {payments.pages > 1 && (
                  <CPagination
                    key={debt.id}
                    updatePages={payments.pages}
                    onChange={onChangePagination}
                  />
                )}
              </>
            )}
          </section>
        </>
      )}
    </Modal>
  );
};

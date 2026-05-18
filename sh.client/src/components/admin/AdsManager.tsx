import React, { useEffect, useMemo, useState } from 'react';
import {
  ImageIcon,
  Loader2,
  Pause,
  Pencil,
  Plus,
  Play,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  api,
  resolveApiAssetUrl,
  AD_PLACEMENTS,
  AD_STATUSES,
  AD_TYPES,
  type ApiAdminAd,
  type ApiAdUpsertBody,
  type AdPlacement,
  type AdStatus,
  type AdType,
} from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import { ModalCloseButton, ModalOverlay } from '../ModalOverlay';
import { ListPagination } from '../ListPagination';
import { usePagination, PAGE_SIZE } from '../../utils/usePagination';

const placementLabel: Record<AdPlacement, string> = {
  home_hero: 'Trang chủ — Banner Hero',
  home_below_search: 'Trang chủ — Dải dưới ô tìm kiếm',
  doctor_detail: 'Trang chi tiết bác sĩ',
  dashboard_user: 'Dashboard bệnh nhân',
};

const statusLabel: Record<AdStatus, string> = {
  draft: 'Bản nháp',
  active: 'Đang hiển thị',
  paused: 'Tạm tắt',
  archived: 'Lưu trữ',
  expired: 'Đã hết hạn',
};

const typeLabel: Record<AdType, string> = {
  banner: 'Banner (chỉ ảnh + link)',
  promo: 'Bài viết khuyến mãi',
};

function formatDateTimeVi(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Convert ISO (UTC) sang chuỗi `YYYY-MM-DDTHH:mm` cho `<input type="datetime-local">`. */
function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const off = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

function localInputToIso(value: string): string {
  if (!value) return '';
  return new Date(value).toISOString();
}

const emptyForm: ApiAdUpsertBody = {
  type: 'banner',
  title: '',
  body: '',
  linkUrl: '',
  placements: ['home_hero'],
  status: 'draft',
  priority: 0,
  startAt: '',
  endAt: '',
};

export const AdsManager: React.FC = () => {
  const toast = useToast();
  const [list, setList] = useState<ApiAdminAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'' | AdStatus>('');
  const [placementFilter, setPlacementFilter] = useState<'' | AdPlacement>('');
  const [searchQ, setSearchQ] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ApiAdUpsertBody>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiAdminAd | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const loadList = () => {
    setLoading(true);
    api
      .getAdminAds({
        status: statusFilter || '',
        placement: placementFilter || '',
        q: searchQ || undefined,
      })
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadList();
  }, [statusFilter, placementFilter, searchQ]);

  const adsPage = usePagination(list, PAGE_SIZE.table, `${statusFilter}-${placementFilter}-${searchQ}`);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(false);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (a: ApiAdminAd) => {
    setEditingId(a.id);
    setForm({
      type: a.type,
      title: a.title,
      body: a.body ?? '',
      linkUrl: a.linkUrl ?? '',
      placements: a.placements,
      status: a.status,
      priority: a.priority,
      startAt: isoToLocalInput(a.startAt),
      endAt: isoToLocalInput(a.endAt),
    });
    setImageFile(null);
    setImagePreview(a.imageUrl ? resolveApiAssetUrl(a.imageUrl) ?? null : null);
    setRemoveImage(false);
    setFormError(null);
    setModalOpen(true);
  };

  const onPickImage = (file: File | null) => {
    if (!file) {
      setImageFile(null);
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const togglePlacement = (p: AdPlacement) => {
    setForm((prev) => {
      const cur = prev.placements ?? [];
      const next = cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p];
      return { ...prev, placements: next };
    });
  };

  const submitForm = async () => {
    setFormError(null);
    if (!form.title || form.title.trim() === '') {
      setFormError('Tiêu đề bắt buộc.');
      return;
    }
    if (!form.placements || form.placements.length === 0) {
      setFormError('Chọn ít nhất 1 vị trí hiển thị.');
      return;
    }
    if (form.startAt && form.endAt) {
      if (new Date(form.startAt).getTime() >= new Date(form.endAt).getTime()) {
        setFormError('Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc.');
        return;
      }
    }

    const payload: ApiAdUpsertBody = {
      ...form,
      title: form.title.trim(),
      body: form.body ?? null,
      linkUrl: (form.linkUrl ?? '').trim() === '' ? null : (form.linkUrl ?? '').trim(),
      startAt: form.startAt ? localInputToIso(form.startAt) : null,
      endAt: form.endAt ? localInputToIso(form.endAt) : null,
    };

    setSubmitting(true);
    try {
      await api.upsertAdminAd(payload, imageFile, {
        id: editingId ?? undefined,
        removeImage: removeImage && !imageFile,
      });
      toast.success(editingId ? 'Đã cập nhật quảng cáo.' : 'Đã tạo quảng cáo.');
      setModalOpen(false);
      loadList();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Không lưu được');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (a: ApiAdminAd) => {
    const next: AdStatus = a.status === 'active' ? 'paused' : 'active';
    try {
      await api.patchAdminAdStatus(a.id, next);
      toast.success(next === 'active' ? 'Đã bật hiển thị.' : 'Đã tạm tắt.');
      loadList();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không đổi được trạng thái');
    }
  };

  const executeDeleteAd = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    try {
      await api.deleteAdminAd(deleteTarget.id);
      toast.success('Đã xóa quảng cáo.');
      setDeleteTarget(null);
      loadList();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không xóa được');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const summary = useMemo(() => {
    const t = list.length;
    const active = list.filter((x) => x.status === 'active').length;
    const effective = list.filter((x) => x.isEffective).length;
    return { total: t, active, effective };
  }, [list]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Quản lý quảng cáo</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng <span className="font-semibold tabular-nums">{summary.total}</span> ·{' '}
            <span className="text-emerald-700 font-semibold tabular-nums">{summary.effective}</span> đang hiệu lực ·{' '}
            <span className="font-semibold tabular-nums">{summary.active}</span> bật
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Thêm quảng cáo
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 px-2 py-1.5 border border-slate-200 rounded-lg bg-white">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setSearchQ(searchInput.trim());
            }}
            onBlur={() => setSearchQ(searchInput.trim())}
            className="text-sm border-0 outline-none bg-transparent w-56"
          />
          {searchInput ? (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearchQ('');
              }}
              className="p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as '' | AdStatus)}
          className="text-sm px-3 py-2 border border-slate-200 rounded-lg bg-white"
        >
          <option value="">Mọi trạng thái</option>
          {AD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel[s]}
            </option>
          ))}
        </select>
        <select
          value={placementFilter}
          onChange={(e) => setPlacementFilter(e.target.value as '' | AdPlacement)}
          className="text-sm px-3 py-2 border border-slate-200 rounded-lg bg-white"
        >
          <option value="">Mọi vị trí</option>
          {AD_PLACEMENTS.map((p) => (
            <option key={p} value={p}>
              {placementLabel[p]}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <p className="p-8 text-center text-slate-500 text-sm">Chưa có quảng cáo nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ảnh</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Tiêu đề</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Vị trí</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">
                    Lịch hiển thị
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Trạng thái</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">
                    Lượt xem / click
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adsPage.paginatedItems.map((a) => {
                  const imgSrc = a.imageUrl ? resolveApiAssetUrl(a.imageUrl) : null;
                  return (
                    <tr key={a.id} className={`hover:bg-slate-50/50 ${a.isEffective ? '' : 'opacity-75'}`}>
                      <td className="px-4 py-3">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={a.title}
                            className="w-20 h-12 object-cover rounded-md border border-slate-200"
                          />
                        ) : (
                          <div className="w-20 h-12 flex items-center justify-center rounded-md border border-dashed border-slate-200 text-slate-400">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[20rem]">
                        <div className="font-medium text-slate-900 truncate" title={a.title}>
                          {a.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {typeLabel[a.type]} · ưu tiên {a.priority}
                        </div>
                        {a.linkUrl ? (
                          <div className="text-[11px] text-sky-700 truncate mt-0.5" title={a.linkUrl}>
                            → {a.linkUrl}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[14rem]">
                          {a.placements.length === 0 ? (
                            <span className="text-xs text-slate-400">—</span>
                          ) : (
                            a.placements.map((p) => (
                              <span
                                key={p}
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700"
                              >
                                {placementLabel[p]}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                        <div>Bắt đầu: {formatDateTimeVi(a.startAt)}</div>
                        <div>Kết thúc: {formatDateTimeVi(a.endAt)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded-md inline-block w-fit ${
                              a.status === 'active'
                                ? 'bg-emerald-100 text-emerald-900'
                                : a.status === 'paused'
                                  ? 'bg-amber-100 text-amber-900'
                                  : a.status === 'expired'
                                    ? 'bg-red-100 text-red-900'
                                    : a.status === 'archived'
                                      ? 'bg-slate-200 text-slate-700'
                                      : 'bg-sky-100 text-sky-900'
                            }`}
                          >
                            {statusLabel[a.status]}
                          </span>
                          <span
                            className={`text-[10px] inline-block w-fit px-1.5 py-0.5 rounded ${
                              a.isEffective
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-50 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {a.isEffective ? '● Đang hiệu lực' : '○ Ngoài kỳ hiệu lực'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs text-slate-600">
                        <div>👁 {a.viewCount}</div>
                        <div>🖱 {a.clickCount}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => toggleStatus(a)}
                            className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg disabled:opacity-40"
                            title={
                              a.status === 'active'
                                ? 'Tạm tắt'
                                : a.status === 'expired'
                                  ? 'Đã hết hạn — gia hạn ngày kết thúc rồi mới bật lại được'
                                  : 'Bật hiển thị'
                            }
                            disabled={
                              a.status === 'archived' ||
                              a.status === 'draft' ||
                              a.status === 'expired'
                            }
                          >
                            {a.status === 'active' ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(a)}
                            className="p-2 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg"
                            title="Sửa"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(a)}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && list.length > 0 && (
          <div className="px-4 pb-4">
            <ListPagination
              page={adsPage.page}
              totalPages={adsPage.totalPages}
              totalItems={adsPage.totalItems}
              pageSize={adsPage.pageSize}
              onPageChange={adsPage.goToPage}
              itemLabel="quảng cáo"
            />
          </div>
        )}
      </div>

      <ModalOverlay open={!!deleteTarget} onClose={() => !deleteSubmitting && setDeleteTarget(null)}>
        <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
          <ModalCloseButton onClose={() => !deleteSubmitting && setDeleteTarget(null)} />
          <h2 className="pr-10 text-lg font-bold text-slate-900">Xóa quảng cáo?</h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Quảng cáo{' '}
            <span className="font-semibold text-slate-800">
              «{deleteTarget?.title ?? ''}»
            </span>{' '}
            sẽ bị xóa vĩnh viễn. Trang chủ và các vị trí hiển thị sẽ không còn banner này ngay sau khi xóa.
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => !deleteSubmitting && setDeleteTarget(null)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
              disabled={deleteSubmitting}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void executeDeleteAd()}
              disabled={deleteSubmitting}
              className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 sm:w-auto inline-flex items-center justify-center gap-2"
            >
              {deleteSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Xóa vĩnh viễn
            </button>
          </div>
        </div>
      </ModalOverlay>

      <ModalOverlay open={modalOpen} onClose={() => !submitting && setModalOpen(false)}>
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingId ? 'Chỉnh sửa quảng cáo' : 'Thêm quảng cáo'}
              </h3>
              <ModalCloseButton onClose={() => !submitting && setModalOpen(false)} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Form */}
              <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
                {formError ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {formError}
                  </div>
                ) : null}

                <div>
                  <label className="text-xs font-semibold text-slate-600">Loại</label>
                  <div className="flex gap-2 mt-1">
                    {AD_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, type: t }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                          form.type === t
                            ? 'bg-primary/10 text-primary border-primary'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {typeLabel[t]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">Tiêu đề *</label>
                  <input
                    type="text"
                    value={form.title ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    maxLength={255}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="VD: Khám tổng quát giảm 20% trong tháng 5"
                  />
                </div>

                {form.type === 'promo' ? (
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Nội dung</label>
                    <textarea
                      value={form.body ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                      rows={4}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="Mô tả ngắn (xuất hiện cùng banner)…"
                    />
                  </div>
                ) : null}

                <div>
                  <label className="text-xs font-semibold text-slate-600">Liên kết khi click (link URL)</label>
                  <input
                    type="text"
                    value={form.linkUrl ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, linkUrl: e.target.value }))}
                    placeholder="https://… hoặc /search?departmentId=…"
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">Vị trí hiển thị *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                    {AD_PLACEMENTS.map((p) => {
                      const checked = form.placements?.includes(p) ?? false;
                      return (
                        <label
                          key={p}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer ${
                            checked
                              ? 'bg-primary/5 border-primary text-slate-900'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePlacement(p)}
                            className="accent-primary"
                          />
                          <span>{placementLabel[p]}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Bắt đầu</label>
                    <input
                      type="datetime-local"
                      value={form.startAt ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, startAt: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Kết thúc</label>
                    <input
                      type="datetime-local"
                      value={form.endAt ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, endAt: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Trạng thái</label>
                    <select
                      value={form.status ?? 'draft'}
                      onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as AdStatus }))}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    >
                      {AD_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {statusLabel[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Ưu tiên (0–1000)</label>
                    <input
                      type="number"
                      min={0}
                      max={1000}
                      value={form.priority ?? 0}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, priority: parseInt(e.target.value || '0', 10) }))
                      }
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Image / preview */}
              <div className="p-5 border-t lg:border-t-0 lg:border-l border-slate-100 bg-slate-50/40 space-y-3 max-h-[75vh] overflow-y-auto">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Ảnh (JPG/PNG/WebP/GIF)</label>
                  <div className="mt-2 rounded-xl border border-dashed border-slate-300 bg-white p-3 flex flex-col items-center gap-2">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full max-h-56 object-contain rounded-lg border border-slate-200"
                      />
                    ) : (
                      <div className="w-full h-40 flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <label className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                        Chọn ảnh
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
                        />
                      </label>
                      {imagePreview ? (
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                            setRemoveImage(true);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                        >
                          Xóa ảnh
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-white border border-slate-200 p-3 text-xs text-slate-500 space-y-2">
                  <div>
                    <p className="font-semibold text-slate-700 mb-1">Gợi ý hiển thị</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Banner Hero: ảnh tỉ lệ 16:9 hoặc 21:9, ≥ 1280px chiều rộng.</li>
                      <li>Promo: có thể kèm nội dung text dài hơn.</li>
                      <li>Để trống <em>Bắt đầu</em>/<em>Kết thúc</em> = không giới hạn thời gian.</li>
                      <li>Trạng thái <em>Bản nháp</em> hoặc <em>Lưu trữ</em> sẽ không hiện ra ngoài site.</li>
                    </ul>
                  </div>
                  <div className="border-t border-slate-100 pt-2">
                    <p className="font-semibold text-slate-700 mb-1">Tự động hết hạn</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Khi quá <em>Ngày kết thúc</em>, hệ thống tự đổi trạng thái sang <strong>“Đã hết hạn”</strong> (kiểm tra mỗi 5 phút).</li>
                      <li>Để dùng lại: chỉnh <em>Ngày kết thúc</em> sang tương lai → hệ thống tự bật lại thành <em>Đang hiển thị</em>.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/40 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !submitting && setModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-200/60"
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={submitForm}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingId ? 'Lưu thay đổi' : 'Tạo quảng cáo'}
              </button>
            </div>
          </div>
      </ModalOverlay>
    </div>
  );
};

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Briefcase, Check, X, Search } from "lucide-react";
import { Button, Input, Card, CardContent } from "@/components/ui";
import useBusinessStore from "@/stores/businessStore";

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Từ chối" },
];

const statusBadge = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const BusinessListPage = ({ initialStatus = "all" }) => {
  const {
    businesses,
    loading,
    pagination,
    fetchAll,
    approveBusiness,
    rejectBusiness,
  } = useBusinessStore();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchAll({ search, status, page: 1 });
  }, [search, status]);

  const handleApprove = async (id) => {
    try {
      await approveBusiness(id);
      toast.success("Duyệt doanh nghiệp thành công");
    } catch (error) {
      toast.error(error.message || "Không thể duyệt");
    }
  };

  const handleReject = async () => {
    if (rejectReason.length < 10) {
      toast.error("Lý do từ chối phải có ít nhất 10 ký tự");
      return;
    }
    try {
      await rejectBusiness(rejectId, rejectReason);
      toast.success("Từ chối doanh nghiệp thành công");
      setRejectId(null);
      setRejectReason("");
    } catch (error) {
      toast.error(error.message || "Không thể từ chối");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Briefcase className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Quản lý doanh nghiệp</h1>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={status === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatus(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
        </div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Không có doanh nghiệp nào
        </div>
      ) : (
        <div className="grid gap-4">
          {businesses.map((biz) => (
            <Card key={biz.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{biz.businessName}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[biz.status]}`}>
                      {biz.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {biz.owner?.fullName} — {biz.owner?.email}
                  </p>
                  <p className="text-sm text-gray-400">
                    Loại: {biz.businessType} | MST: {biz.taxCode || "—"} | Địa điểm: {biz._count?.places || 0}
                  </p>
                </div>
                <div className="flex gap-2">
                  {biz.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => handleApprove(biz.id)}>
                        <Check className="h-4 w-4 mr-1" /> Duyệt
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setRejectId(biz.id)}
                      >
                        <X className="h-4 w-4 mr-1" /> Từ chối
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {rejectId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
            <h3 className="text-lg font-bold">Từ chối doanh nghiệp</h3>
            <textarea
              className="w-full border rounded-md p-3 min-h-[100px]"
              placeholder="Lý do từ chối (ít nhất 10 ký tự)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setRejectId(null); setRejectReason(""); }}>
                Hủy
              </Button>
              <Button variant="destructive" onClick={handleReject}>
                Xác nhận từ chối
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessListPage;

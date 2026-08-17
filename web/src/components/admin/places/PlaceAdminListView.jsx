import React, { memo } from "react";
import { MapPin } from "lucide-react";
import { getPlaceCardImageSrc, getStatusBadge } from "./placesAdminConstants";

export const PlaceAdminListView = memo(
  ({ places, handleViewDetails, handleEdit }) => {
    return (
      <div className="space-y-3">
        {places.map((place) => (
          <div
            key={place.id}
            className="flex flex-col sm:flex-row sm:items-center bg-white rounded-2xl border border-black/[0.04] p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all gap-3"
          >
            <div className="w-full sm:w-16 sm:h-16 h-36 bg-[#F4F2EC] rounded-xl overflow-hidden shrink-0 relative border border-black/[0.04]">
              {getPlaceCardImageSrc(place) ? (
                <img
                  src={getPlaceCardImageSrc(place)}
                  className="w-full h-full object-cover"
                  alt={place.name}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-slate-300" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col md:grid md:grid-cols-12 md:items-center gap-2 md:gap-4">
              <div className="md:col-span-5 min-w-0">
                <h4
                  className="font-bold text-sm text-slate-950 truncate cursor-pointer hover:text-slate-800"
                  onClick={() => handleViewDetails(place)}
                >
                  {place.name}
                </h4>
                <div
                  className="text-[11px] text-slate-400 truncate"
                  title={place.address}
                >
                  {place.address || "Chưa có địa chỉ"}
                </div>
              </div>

              <div className="md:col-span-3 flex items-center gap-2">
                <span className="text-[11px] font-semibold bg-[#F5F4F0] px-2.5 py-0.5 rounded-full text-slate-800">
                  {place.category?.name || "Chưa phân loại"}
                </span>
              </div>

              <div className="md:col-span-2">
                {getStatusBadge(place.status)}
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 mt-2 md:mt-0">
                <button
                  type="button"
                  onClick={() => handleEdit(place)}
                  className="h-8 px-3 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-semibold shadow-2xs transition-all"
                >
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => handleViewDetails(place)}
                  className="h-8 px-3 rounded-xl bg-white hover:bg-[#F5F4F0] text-slate-900 border border-black/[0.06] text-xs font-semibold transition-all"
                >
                  Chi tiết
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
);

PlaceAdminListView.displayName = "PlaceAdminListView";
export default PlaceAdminListView;

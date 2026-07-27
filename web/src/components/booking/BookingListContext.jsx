import React, { createContext, useContext, useState, useMemo } from "react";

const BookingListContext = createContext(null);

export function BookingListProvider({ children, initialValue = {} }) {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedPlace, setSelectedPlace] = useState("all");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [rescheduleBooking, setRescheduleBooking] = useState(null);
  const [cancelModalBookingId, setCancelModalBookingId] = useState(null);
  const [rejectModalBookingId, setRejectModalBookingId] = useState(null);
  const [detailModalBooking, setDetailModalBooking] = useState(null);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      selectedPlace,
      setSelectedPlace,
      search,
      setSearch,
      dateRange,
      setDateRange,
      selectedBookings,
      setSelectedBookings,
      rescheduleBooking,
      setRescheduleBooking,
      cancelModalBookingId,
      setCancelModalBookingId,
      rejectModalBookingId,
      setRejectModalBookingId,
      detailModalBooking,
      setDetailModalBooking,
      qrScannerOpen,
      setQrScannerOpen,
      actionLoading,
      setActionLoading,
      ...initialValue,
    }),
    [
      activeTab,
      selectedPlace,
      search,
      dateRange,
      selectedBookings,
      rescheduleBooking,
      cancelModalBookingId,
      rejectModalBookingId,
      detailModalBooking,
      qrScannerOpen,
      actionLoading,
      initialValue,
    ]
  );

  return (
    <BookingListContext.Provider value={value}>
      {children}
    </BookingListContext.Provider>
  );
}

export function useBookingListContext() {
  const context = useContext(BookingListContext);
  if (!context) {
    throw new Error("useBookingListContext must be used within a BookingListProvider");
  }
  return context;
}

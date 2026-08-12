export const defaultInclude = {
  service: {
    select: {
      id: true,
      name: true,
      price: true,
      maxCapacity: true,
      durationMinutes: true,
      bookingModel: true,
      slotDurationMinutes: true,
      allowOverbooking: true,
      businessId: true,
      business: {
        select: {
          id: true,
          businessName: true,
          status: true,
          settings: true,
          commissionRate: true,
        },
      },
      place: { select: { id: true, name: true, address: true } },
    },
  },
  user: {
    select: {
      id: true,
      email: true,
      profile: {
        select: {
          fullName: true,
          phone: true,
        },
      },
    },
  },
  resource: {
    select: {
      id: true,
      name: true,
      code: true,
      resourceType: true,
      capacity: true,
    },
  },
};

export const serializeBookingUser = (booking) => {
  if (!booking?.user) return booking;

  const { user, ...rest } = booking;
  return {
    ...rest,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.profile?.fullName || null,
      phone: user.profile?.phone || null,
    },
  };
};

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

interface BookingPolicy {
  depositAmount: number;
  consultationFee: number;
}

const DEFAULT: BookingPolicy = { depositAmount: 50_000, consultationFee: 50_000 };

const BookingPolicyContext = createContext<BookingPolicy>(DEFAULT);

export const BookingPolicyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [policy, setPolicy] = useState<BookingPolicy>(DEFAULT);

  useEffect(() => {
    api.getBookingPolicy()
      .then((r) => setPolicy({ depositAmount: r.depositAmount, consultationFee: r.consultationFee }))
      .catch(() => { /* giữ fallback */ });
  }, []);

  return (
    <BookingPolicyContext.Provider value={policy}>
      {children}
    </BookingPolicyContext.Provider>
  );
};

export const useBookingPolicy = () => useContext(BookingPolicyContext);

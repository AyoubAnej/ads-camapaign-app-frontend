
export interface Seller {
  sellerId: number;  
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  address: string;
  shopName: string;  // Changed from companyName to match backend
  isRegistered: boolean;
}

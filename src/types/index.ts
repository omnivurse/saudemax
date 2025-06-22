export interface User {
  id: string;
  email: string;
  name: string;
  role: 'member' | 'advisor' | 'admin';
  preferredLanguage: 'en' | 'pt';
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthPlan {
  id: string;
  name: string;
  type: 'individual' | 'family';
  monthlyRate: number;
  annualDeductible: number;
  benefits: string[];
  maxMedicalBenefit: string;
  highlights: string[];
  isPopular?: boolean;
}

export interface EnrollmentApplication {
  id: string;
  userId: string;
  planId: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  personalInfo: PersonalInfo;
  dependents: Dependent[];
  healthInfo: HealthInfo;
  advisorId?: string;
  submittedAt?: Date;
  approvedAt?: Date;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: Address;
  employmentStatus: string;
  income: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Dependent {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  relationship: string;
}

export interface HealthInfo {
  hasPreexistingConditions: boolean;
  conditions?: string[];
  medications?: string[];
  hasRecentHospitalization: boolean;
  smokingStatus: 'never' | 'former' | 'current';
}

export interface Advisor {
  id: string;
  name: string;
  email: string;
  phone: string;
  territory: string[];
  commission: number;
  leads: number;
  conversions: number;
  totalEarnings: number;
}

export interface Commission {
  id: string;
  advisorId: string;
  enrollmentId: string;
  amount: number;
  status: 'pending' | 'paid';
  paidAt?: Date;
}

// Member Portal Types
export interface MemberProfile {
  id: string;
  userId: string;
  planId: string;
  memberNumber: string;
  status: 'active' | 'pending' | 'suspended' | 'cancelled';
  enrollmentDate: string;
  nextBillingDate: string;
  monthlyContribution: number;
  dependents: MemberDependent[];
  advisorId: string;
}

export interface MemberDependent {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  relationship: string;
  status: 'active' | 'inactive';
}

export interface Document {
  id: string;
  memberId: string;
  name: string;
  type: 'id_card' | 'guidelines' | 'invoice' | 'enrollment' | 'certificate' | 'other';
  description?: string;
  fileUrl: string;
  fileSize: number;
  uploadDate: string;
  isPublic: boolean;
}

export interface ShareRequest {
  id: string;
  memberId: string;
  requestNumber: string;
  type: 'medical' | 'dental' | 'vision' | 'emergency' | 'prescription';
  description: string;
  provider: string;
  serviceDate: string;
  requestedAmount: number;
  approvedAmount?: number;
  status: 'submitted' | 'under_review' | 'approved' | 'denied' | 'paid';
  submittedDate: string;
  reviewedDate?: string;
  paidDate?: string;
  documents: ShareRequestDocument[];
  notes?: string;
  reviewNotes?: string;
}

export interface ShareRequestDocument {
  id: string;
  shareRequestId: string;
  name: string;
  type: 'receipt' | 'eob' | 'prescription' | 'medical_report' | 'other';
  fileUrl: string;
  fileSize: number;
  uploadDate: string;
}

export interface BillingRecord {
  id: string;
  memberId: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue' | 'failed';
  paymentMethod?: string;
  description: string;
  invoiceUrl?: string;
}

export interface PaymentMethod {
  id: string;
  memberId: string;
  type: 'credit_card' | 'bank_transfer' | 'crypto' | 'pix';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface SupportTicket {
  id: string;
  memberId: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'billing' | 'claims' | 'technical' | 'general';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: 'member' | 'advisor' | 'admin' | 'system';
  content: string;
  timestamp: string;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  name: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
}
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Link as LinkIcon,
  Trash2,
  Shield,
  Phone,
  Briefcase,
  Building,
  Check,
} from "lucide-react";
import {
  useSession,
  useUpdateUser,
  useChangePassword,
  useChangeEmail,
  useListLinkedAccounts,
  useLinkSocialAccount,
  useUnlinkSocialAccount,
  useDeleteUser,
  useUpdateUsername,
} from "@/lib/api/hooks";
import { useUpdateUserProfile } from "@/lib/api/hooks/user";
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";
import {
  useGet2FAStatus,
  useDisable2FA,
  useSendPhoneVerification,
  useVerifyPhoneNumber,
  useUpdatePhoneNumber,
} from "@/lib/api/hooks";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import OtpInput from "react-otp-input";

// Extended user type with custom profile fields
interface ExtendedUser {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  username?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  company?: string | null;
  location?: string | null;
  bio?: string | null;
}

export function ProfileTabs() {
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "accounts" | "danger">("profile");

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "accounts", label: "Linked Accounts", icon: LinkIcon },
    { id: "danger", label: "Danger Zone", icon: Trash2 },
  ] as const;

  return (
    <div>
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "security" && <SecurityTab />}
        {activeTab === "accounts" && <LinkedAccountsTab />}
        {activeTab === "danger" && <DangerZoneTab />}
      </motion.div>
    </div>
  );
}

function ProfileTab() {
  const { data: session } = useSession();
  const user = session?.user as ExtendedUser | undefined;

  const updateUserMutation = useUpdateUser();
  const updateUsernameMutation = useUpdateUsername();
  const updateProfileMutation = useUpdateUserProfile();

  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || "");
  const [department, setDepartment] = useState(user?.department || "");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Update Better Auth fields (name, image)
      const betterAuthUpdates: { name?: string; image?: string } = { name };
      if (imageUrl) {
        betterAuthUpdates.image = imageUrl;
      }
      await updateUserMutation.mutateAsync(betterAuthUpdates);

      // Update custom profile fields
      // Note: phone, jobTitle, department are not currently supported by the API
      // await updateProfileMutation.mutateAsync({
      //   phone,
      //   jobTitle,
      //   department,
      // });

      alert("Profile updated successfully!");
    } catch (_error) {
      alert("Failed to update profile");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, we'll use a placeholder. In production, you'd upload to a storage service
    // and get back a URL (e.g., AWS S3, Cloudinary, etc.)
    setIsUploadingImage(true);
    try {
      // TODO: Implement actual file upload to storage service
      // const uploadedUrl = await uploadToStorage(file);
      // setImageUrl(uploadedUrl);

      // For now, create a local object URL for preview
      const objectUrl = URL.createObjectURL(file);
      setImageUrl(objectUrl);
      alert("Image ready. Click 'Save Changes' to update your profile.");
    } catch (_error) {
      alert("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUsernameMutation.mutateAsync(username);
      alert("Username updated successfully!");
    } catch (_error) {
      alert("Failed to update username");
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Picture */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h3>
        <div className="flex items-center gap-6">
          <div className="relative">
            {imageUrl || user?.image ? (
              <img
                src={imageUrl || user?.image || undefined}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
          </div>
          <div>
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors mb-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploadingImage}
              />
              {isUploadingImage ? "Uploading..." : "Upload Photo"}
            </label>
            <p className="text-sm text-gray-500">JPG, PNG or GIF. Max size 2MB.</p>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="text-sm text-gray-500 mt-1">Email cannot be changed here. Use Security tab.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 inline mr-2" />
              Phone Number
            </label>
            <PhoneInput
              international
              defaultCountry="QA"
              value={phone}
              onChange={(value) => setPhone(value || "")}
              className="phone-input-custom"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Briefcase className="w-4 h-4 inline mr-2" />
              Job Title
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Senior Accountant"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building className="w-4 h-4 inline mr-2" />
              Department
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Accounting"
            />
          </div>

          <button
            type="submit"
            disabled={updateUserMutation.isPending || updateProfileMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {updateUserMutation.isPending || updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Username */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Username</h3>
        <form onSubmit={handleUpdateUsername} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="johndoe"
            />
            <p className="text-sm text-gray-500 mt-1">Your unique username for signing in</p>
          </div>

          <button
            type="submit"
            disabled={updateUsernameMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {updateUsernameMutation.isPending ? "Updating..." : "Update Username"}
          </button>
        </form>
      </div>
    </div>
  );
}

function SecurityTab() {
  const changePasswordMutation = useChangePassword();
  const changeEmailMutation = useChangeEmail();
  const disable2FAMutation = useDisable2FA();
  const twoFactorStatus = useGet2FAStatus();
  const { data: session } = useSession();
  const sendPhoneVerificationMutation = useSendPhoneVerification();
  const verifyPhoneNumberMutation = useVerifyPhoneNumber();
  const updatePhoneNumberMutation = useUpdatePhoneNumber();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [disable2FAPassword, setDisable2FAPassword] = useState("");

  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [phoneVerificationCode, setPhoneVerificationCode] = useState("");
  const [phoneVerificationSent, setPhoneVerificationSent] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });
      alert("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (_error) {
      alert("Failed to change password");
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await changeEmailMutation.mutateAsync(newEmail);
      alert("Email change initiated! Check your new email for verification.");
      setNewEmail("");
    } catch (_error) {
      alert("Failed to change email");
    }
  };

  const handleDisable2FA = async () => {
    if (!disable2FAPassword) {
      alert("Please enter your password");
      return;
    }
    if (!confirm("Are you sure you want to disable two-factor authentication?")) return;

    try {
      await disable2FAMutation.mutateAsync(disable2FAPassword);
      alert("Two-factor authentication disabled successfully");
      setDisable2FAPassword("");
      twoFactorStatus.refetch();
    } catch (_error) {
      alert("Failed to disable 2FA. Please check your password.");
    }
  };

  const handle2FASetupSuccess = () => {
    twoFactorStatus.refetch();
    alert("Two-factor authentication enabled successfully!");
  };

  const handleSendPhoneVerification = async () => {
    if (!phoneNumber) {
      alert("Please enter a valid phone number");
      return;
    }
    try {
      await sendPhoneVerificationMutation.mutateAsync(phoneNumber);
      setPhoneVerificationSent(true);
      alert("Verification code sent to your phone!");
    } catch (_error) {
      alert("Failed to send verification code");
    }
  };

  const handleVerifyPhone = async () => {
    if (phoneVerificationCode.length !== 6) {
      alert("Please enter the 6-digit verification code");
      return;
    }
    try {
      // If user already has a phone number, update it; otherwise verify new one
      if (session?.user?.phoneNumber) {
        await updatePhoneNumberMutation.mutateAsync({
          phoneNumber,
          code: phoneVerificationCode,
        });
        alert("Phone number updated successfully!");
      } else {
        await verifyPhoneNumberMutation.mutateAsync({
          phoneNumber,
          code: phoneVerificationCode,
        });
        alert("Phone number verified successfully!");
      }
      setShowPhoneVerification(false);
      setPhoneNumber("");
      setPhoneVerificationCode("");
      setPhoneVerificationSent(false);
    } catch (_error) {
      alert("Invalid verification code");
      setPhoneVerificationCode("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Change Password
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>

      {/* Change Email */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Change Email Address
        </h3>
        <form onSubmit={handleChangeEmail} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Email Address</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="newemail@example.com"
              required
            />
            <p className="text-sm text-gray-500 mt-1">You&apos;ll need to verify your new email address</p>
          </div>
          <button
            type="submit"
            disabled={changeEmailMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {changeEmailMutation.isPending ? "Updating..." : "Update Email"}
          </button>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Two-Factor Authentication
        </h3>

        {twoFactorStatus?.data ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              <span className="font-medium">2FA is enabled on your account</span>
            </div>
            <p className="text-sm text-gray-600">
              Your account is protected with two-factor authentication. You can disable it below if needed.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleDisable2FA();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password to Disable 2FA
                </label>
                <input
                  type="password"
                  value={disable2FAPassword}
                  onChange={(e) => setDisable2FAPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={disable2FAMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {disable2FAMutation.isPending ? "Disabling..." : "Disable 2FA"}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">
              Add an extra layer of security to your account by enabling two-factor authentication.
              You&apos;ll need to enter a code from your authenticator app when signing in.
            </p>
            <button
              onClick={() => setShow2FASetup(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Enable Two-Factor Authentication
            </button>
          </div>
        )}
      </div>

      {/* Phone Number Verification */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5" />
          Phone Number
        </h3>

        {session?.user?.phoneNumber ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-green-800">Verified Phone Number</p>
                <p className="text-sm text-green-600">{session.user.phoneNumber}</p>
              </div>
              <button
                onClick={() => setShowPhoneVerification(true)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Change
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">
              Add a phone number to your account for additional security and account recovery options.
            </p>

            {!showPhoneVerification ? (
              <button
                onClick={() => setShowPhoneVerification(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Add Phone Number
              </button>
            ) : (
              <div className="space-y-4">
                {!phoneVerificationSent ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <PhoneInput
                        international
                        defaultCountry="EG"
                        value={phoneNumber}
                        onChange={(value) => setPhoneNumber(value || "")}
                        className="phone-input-custom"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        We&apos;ll send you a verification code via SMS
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowPhoneVerification(false);
                          setPhoneNumber("");
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSendPhoneVerification}
                        disabled={!phoneNumber || sendPhoneVerificationMutation.isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {sendPhoneVerificationMutation.isPending ? "Sending..." : "Send Code"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Code sent to: <span className="font-medium">{phoneNumber}</span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        6-Digit Verification Code
                      </label>
                      <div className="flex justify-center">
                        <OtpInput
                          value={phoneVerificationCode}
                          onChange={setPhoneVerificationCode}
                          numInputs={6}
                          renderSeparator={<span className="mx-2">-</span>}
                          renderInput={(props) => (
                            <input
                              {...props}
                              className="!w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setPhoneVerificationSent(false);
                          setPhoneVerificationCode("");
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleVerifyPhone}
                        disabled={phoneVerificationCode.length !== 6 || verifyPhoneNumberMutation.isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {verifyPhoneNumberMutation.isPending ? "Verifying..." : "Verify"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2FA Setup Modal */}
      <TwoFactorSetup
        isOpen={show2FASetup}
        onClose={() => setShow2FASetup(false)}
        onSuccess={handle2FASetupSuccess}
      />
    </div>
  );
}

interface LinkedAccount {
  id: string;
  providerId: string;
  [key: string]: unknown;
}

function LinkedAccountsTab() {
  const { data: accounts, isLoading } = useListLinkedAccounts();
  const linkAccountMutation = useLinkSocialAccount();
  const unlinkAccountMutation = useUnlinkSocialAccount();

  const handleLinkGoogle = async () => {
    try {
      await linkAccountMutation.mutateAsync({ provider: "google" });
    } catch (_error) {
      alert("Failed to link Google account");
    }
  };

  const handleUnlink = async (accountId: string, providerId: string) => {
    if (!confirm("Are you sure you want to unlink this account?")) return;
    try {
      await unlinkAccountMutation.mutateAsync({ accountId, providerId });
      alert("Account unlinked successfully!");
    } catch (_error) {
      alert("Failed to unlink account");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Accounts</h3>
        <p className="text-gray-600 mb-6">Link your social accounts for quick sign-in</p>

        {isLoading ? (
          <div className="text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-4">
            {/* Google */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold">G</span>
                </div>
                <div>
                  <div className="font-medium">Google</div>
                  <div className="text-sm text-gray-500">Sign in with your Google account</div>
                </div>
              </div>
              {accounts?.find((acc: LinkedAccount) => acc.providerId === "google") ? (
                <button
                  onClick={() => {
                    const account = accounts.find((acc: LinkedAccount) => acc.providerId === "google");
                    if (account) handleUnlink(account.id!, account.providerId);
                  }}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Unlink
                </button>
              ) : (
                <button
                  onClick={handleLinkGoogle}
                  disabled={linkAccountMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Link
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DangerZoneTab() {
  const deleteUserMutation = useDeleteUser();
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText !== "DELETE") {
      alert("Please type DELETE to confirm");
      return;
    }
    if (!confirm("This action cannot be undone. Are you absolutely sure?")) return;

    try {
      await deleteUserMutation.mutateAsync(password);
      alert("Account deleted successfully");
      window.location.href = "/";
    } catch (_error) {
      alert("Failed to delete account");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-2 flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Delete Account
        </h3>
        <p className="text-red-700 mb-6">
          Once you delete your account, there is no going back. Please be certain.
        </p>

        <form onSubmit={handleDeleteAccount} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-red-900 mb-2">Confirm Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-red-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-red-900 mb-2">
              Type <strong>DELETE</strong> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-4 py-2 border border-red-300 rounded-lg"
              placeholder="DELETE"
              required
            />
          </div>
          <button
            type="submit"
            disabled={deleteUserMutation.isPending}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {deleteUserMutation.isPending ? "Deleting..." : "Delete My Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

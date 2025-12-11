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
  useGet2FAStatus,
  useDisable2FA,
  useSendPhoneVerification,
  useVerifyPhoneNumber,
  useUpdatePhoneNumber
} from "@/lib/api/hooks";
import { useUpdateUserProfile } from "@/lib/api/hooks/user";
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import OtpInput from "react-otp-input";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import { useToast, useConfirm, SafeeToastContainer } from "@/components/feedback";
import { AvatarUpload } from "@/components/common";
import { useQueryClient } from "@tanstack/react-query";

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
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "accounts" | "danger">("profile");

  const tabs = [
    { id: "profile", label: t.settings.profile.tabs.profile, icon: User },
    { id: "security", label: t.settings.profile.tabs.security, icon: Shield },
    { id: "accounts", label: t.settings.profile.tabs.linkedAccounts, icon: LinkIcon },
    { id: "danger", label: t.settings.profile.tabs.dangerZone, icon: Trash2 },
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
                onClick={() => { setActiveTab(tab.id); }}
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
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Update Better Auth fields (name)
      await updateUserMutation.mutateAsync({ name });

      // Update custom profile fields
      // Note: phone, jobTitle, department are not currently supported by the API
      // await updateProfileMutation.mutateAsync({
      //   phone,
      //   jobTitle,
      //   department,
      // });

      toast.success(t.settings.profile.profileTab.alerts.profileSuccess);
    } catch (err) {
      toast.error(t.settings.profile.profileTab.alerts.profileFailed);
    }
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUsernameMutation.mutateAsync(username);
      toast.success(t.settings.profile.profileTab.alerts.usernameSuccess);
    } catch (err) {
      toast.error(t.settings.profile.profileTab.alerts.usernameFailed);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Profile Picture */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t.settings.profile.profileTab.profilePicture.title}
          </h3>
          <div className="flex items-center gap-6">
            <AvatarUpload
              currentAvatarUrl={user?.image || undefined}
              endpoint="/api/v1/users/me/avatar"
              method="PUT"
              maxSize={5 * 1024 * 1024} // 5MB
              onSuccess={(_metadata) => {
                queryClient.invalidateQueries({ queryKey: ["session"] });
                toast.success(t.settings.profile.profileTab.alerts.profileSuccess);
              }}
              onError={(_error) => {
                toast.error(t.settings.profile.profileTab.alerts.imageUploadFailed);
              }}
            />
            <div>
              <p className="text-sm text-gray-600 mb-1">
                {t.settings.profile.profileTab.profilePicture.uploadPhoto}
              </p>
              <p className="text-xs text-gray-500">{t.settings.profile.profileTab.profilePicture.formats}</p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t.settings.profile.profileTab.basicInformation.title}
          </h3>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                {t.settings.profile.profileTab.basicInformation.fullName}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t.settings.profile.profileTab.basicInformation.fullNamePlaceholder}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                {t.settings.profile.profileTab.basicInformation.emailAddress}
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                {t.settings.profile.profileTab.basicInformation.emailNote}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                {t.settings.profile.profileTab.basicInformation.phoneNumber}
              </label>
              <PhoneInput
                international
                defaultCountry="QA"
                value={phone}
                onChange={(value) => { setPhone(value || ""); }}
                className="phone-input-custom"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="w-4 h-4 inline mr-2" />
                {t.settings.profile.profileTab.basicInformation.jobTitle}
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => { setJobTitle(e.target.value); }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t.settings.profile.profileTab.basicInformation.jobTitlePlaceholder}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="w-4 h-4 inline mr-2" />
                {t.settings.profile.profileTab.basicInformation.department}
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => { setDepartment(e.target.value); }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t.settings.profile.profileTab.basicInformation.departmentPlaceholder}
              />
            </div>

            <button
              type="submit"
              disabled={updateUserMutation.isPending || updateProfileMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {updateUserMutation.isPending || updateProfileMutation.isPending
                ? t.settings.profile.profileTab.basicInformation.saving
                : t.settings.profile.profileTab.basicInformation.saveChanges}
            </button>
          </form>
        </div>

        {/* Username */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t.settings.profile.profileTab.username.title}
          </h3>
          <form onSubmit={handleUpdateUsername} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.settings.profile.profileTab.username.label}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t.settings.profile.profileTab.username.placeholder}
              />
              <p className="text-sm text-gray-500 mt-1">{t.settings.profile.profileTab.username.note}</p>
            </div>

            <button
              type="submit"
              disabled={updateUsernameMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {updateUsernameMutation.isPending
                ? t.settings.profile.profileTab.username.updating
                : t.settings.profile.profileTab.username.updateButton}
            </button>
          </form>
        </div>
      </div>
      <SafeeToastContainer notifications={toast.notifications} onRemove={toast.removeToast} />
    </>
  );
}

function SecurityTab() {
  const { t } = useTranslation();
  const toast = useToast();
  const { confirm, ConfirmModalComponent } = useConfirm();
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
      toast.error(t.settings.profile.securityTab.alerts.passwordMismatch);
      return;
    }
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });
      toast.success(t.settings.profile.securityTab.alerts.passwordSuccess);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(t.settings.profile.securityTab.alerts.passwordFailed);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await changeEmailMutation.mutateAsync(newEmail);
      toast.success(t.settings.profile.securityTab.alerts.emailSuccess);
      setNewEmail("");
    } catch (err) {
      toast.error(t.settings.profile.securityTab.alerts.emailFailed);
    }
  };

  const handleDisable2FA = async () => {
    if (!disable2FAPassword) {
      toast.error(t.settings.profile.securityTab.alerts.disable2FAPrompt);
      return;
    }
    const confirmed = await confirm({
      title: t.settings.profile.securityTab.twoFactor.disableButton,
      message: t.settings.profile.securityTab.alerts.disable2FAConfirm,
      type: "warning",
      confirmText: t.settings.profile.securityTab.twoFactor.disableButton,
    });

    if (!confirmed) return;

    try {
      await disable2FAMutation.mutateAsync(disable2FAPassword);
      toast.success(t.settings.profile.securityTab.alerts.disable2FASuccess);
      setDisable2FAPassword("");
      twoFactorStatus.refetch();
    } catch (err) {
      toast.error(t.settings.profile.securityTab.alerts.disable2FAFailed);
    }
  };

  const handle2FASetupSuccess = () => {
    twoFactorStatus.refetch();
    toast.success(t.settings.profile.securityTab.alerts.twoFactorSuccess);
  };

  const handleSendPhoneVerification = async () => {
    if (!phoneNumber) {
      toast.error(t.settings.profile.securityTab.alerts.phoneInvalid);
      return;
    }
    try {
      await sendPhoneVerificationMutation.mutateAsync(phoneNumber);
      setPhoneVerificationSent(true);
      toast.success(t.settings.profile.securityTab.alerts.phoneCodeSent);
    } catch (err) {
      toast.error(t.settings.profile.securityTab.alerts.phoneCodeFailed);
    }
  };

  const handleVerifyPhone = async () => {
    if (phoneVerificationCode.length !== 6) {
      toast.error(t.settings.profile.securityTab.alerts.phoneCodeInvalid);
      return;
    }
    try {
      // If user already has a phone number, update it; otherwise verify new one
      if (session?.user?.phoneNumber) {
        await updatePhoneNumberMutation.mutateAsync({
          phoneNumber,
          code: phoneVerificationCode,
        });
        toast.success(t.settings.profile.securityTab.alerts.phoneUpdateSuccess);
      } else {
        await verifyPhoneNumberMutation.mutateAsync({
          phoneNumber,
          code: phoneVerificationCode,
        });
        toast.success(t.settings.profile.securityTab.alerts.phoneVerifySuccess);
      }
      setShowPhoneVerification(false);
      setPhoneNumber("");
      setPhoneVerificationCode("");
      setPhoneVerificationSent(false);
    } catch (err) {
      toast.error(t.settings.profile.securityTab.alerts.phoneVerifyFailed);
      setPhoneVerificationCode("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          {t.settings.profile.securityTab.changePassword.title}
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.settings.profile.securityTab.changePassword.currentPassword}
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.settings.profile.securityTab.changePassword.newPassword}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.settings.profile.securityTab.changePassword.confirmPassword}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {changePasswordMutation.isPending
              ? t.settings.profile.securityTab.changePassword.changing
              : t.settings.profile.securityTab.changePassword.changeButton}
          </button>
        </form>
      </div>

      {/* Change Email */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          {t.settings.profile.securityTab.changeEmail.title}
        </h3>
        <form onSubmit={handleChangeEmail} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.settings.profile.securityTab.changeEmail.newEmail}
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => { setNewEmail(e.target.value); }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder={t.settings.profile.securityTab.changeEmail.newEmailPlaceholder}
              required
            />
            <p className="text-sm text-gray-500 mt-1">{t.settings.profile.securityTab.changeEmail.note}</p>
          </div>
          <button
            type="submit"
            disabled={changeEmailMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {changeEmailMutation.isPending
              ? t.settings.profile.securityTab.changeEmail.updating
              : t.settings.profile.securityTab.changeEmail.updateButton}
          </button>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          {t.settings.profile.securityTab.twoFactor.title}
        </h3>

        {twoFactorStatus?.data ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              <span className="font-medium">{t.settings.profile.securityTab.twoFactor.enabled}</span>
            </div>
            <p className="text-sm text-gray-600">{t.settings.profile.securityTab.twoFactor.enabledNote}</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleDisable2FA();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.settings.profile.securityTab.twoFactor.confirmPasswordLabel}
                </label>
                <input
                  type="password"
                  value={disable2FAPassword}
                  onChange={(e) => { setDisable2FAPassword(e.target.value); }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder={t.settings.profile.securityTab.twoFactor.confirmPasswordPlaceholder}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={disable2FAMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {disable2FAMutation.isPending
                  ? t.settings.profile.securityTab.twoFactor.disabling
                  : t.settings.profile.securityTab.twoFactor.disableButton}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">{t.settings.profile.securityTab.twoFactor.notEnabled}</p>
            <button
              onClick={() => { setShow2FASetup(true); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              {t.settings.profile.securityTab.twoFactor.enableButton}
            </button>
          </div>
        )}
      </div>

      {/* Phone Number Verification */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5" />
          {t.settings.profile.securityTab.phoneNumber.title}
        </h3>

        {session?.user?.phoneNumber ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-green-800">
                  {t.settings.profile.securityTab.phoneNumber.verified}
                </p>
                <p className="text-sm text-green-600">{session.user.phoneNumber}</p>
              </div>
              <button
                onClick={() => { setShowPhoneVerification(true); }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {t.settings.profile.securityTab.phoneNumber.changeButton}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">{t.settings.profile.securityTab.phoneNumber.note}</p>

            {!showPhoneVerification ? (
              <button
                onClick={() => { setShowPhoneVerification(true); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                {t.settings.profile.securityTab.phoneNumber.addButton}
              </button>
            ) : (
              <div className="space-y-4">
                {!phoneVerificationSent ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.settings.profile.securityTab.phoneNumber.phoneNumberLabel}
                      </label>
                      <PhoneInput
                        international
                        defaultCountry="EG"
                        value={phoneNumber}
                        onChange={(value) => { setPhoneNumber(value || ""); }}
                        className="phone-input-custom"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {t.settings.profile.securityTab.phoneNumber.verificationNote}
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
                        {t.settings.profile.securityTab.phoneNumber.cancel}
                      </button>
                      <button
                        onClick={handleSendPhoneVerification}
                        disabled={!phoneNumber || sendPhoneVerificationMutation.isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {sendPhoneVerificationMutation.isPending
                          ? t.settings.profile.securityTab.phoneNumber.sending
                          : t.settings.profile.securityTab.phoneNumber.sendCode}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        {t.settings.profile.securityTab.phoneNumber.codeSentTo}{" "}
                        <span className="font-medium">{phoneNumber}</span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.settings.profile.securityTab.phoneNumber.verificationCode}
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
                        {t.settings.profile.securityTab.phoneNumber.back}
                      </button>
                      <button
                        onClick={handleVerifyPhone}
                        disabled={phoneVerificationCode.length !== 6 || verifyPhoneNumberMutation.isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {verifyPhoneNumberMutation.isPending
                          ? t.settings.profile.securityTab.phoneNumber.verifying
                          : t.settings.profile.securityTab.phoneNumber.verify}
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
        onClose={() => { setShow2FASetup(false); }}
        onSuccess={handle2FASetupSuccess}
      />
      <SafeeToastContainer notifications={toast.notifications} onRemove={toast.removeToast} />
      <ConfirmModalComponent />
    </div>
  );
}

interface LinkedAccount {
  id: string;
  providerId: string;
  [key: string]: unknown;
}

function LinkedAccountsTab() {
  const { t } = useTranslation();
  const toast = useToast();
  const { confirm, ConfirmModalComponent } = useConfirm();
  const { data: accounts, isLoading } = useListLinkedAccounts();
  const linkAccountMutation = useLinkSocialAccount();
  const unlinkAccountMutation = useUnlinkSocialAccount();

  const handleLinkGoogle = async () => {
    try {
      await linkAccountMutation.mutateAsync({ provider: "google" });
    } catch (err) {
      toast.error(t.settings.profile.linkedAccountsTab.alerts.linkFailed);
    }
  };

  const handleUnlink = async (accountId: string, providerId: string) => {
    const confirmed = await confirm({
      title: t.settings.profile.linkedAccountsTab.unlinkButton,
      message: t.settings.profile.linkedAccountsTab.unlinkConfirm,
      type: "warning",
      confirmText: t.settings.profile.linkedAccountsTab.unlinkButton,
    });

    if (!confirmed) return;
    try {
      await unlinkAccountMutation.mutateAsync({ accountId, providerId });
      toast.success(t.settings.profile.linkedAccountsTab.alerts.unlinkSuccess);
    } catch (err) {
      toast.error(t.settings.profile.linkedAccountsTab.alerts.unlinkFailed);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t.settings.profile.linkedAccountsTab.title}
        </h3>
        <p className="text-gray-600 mb-6">{t.settings.profile.linkedAccountsTab.description}</p>

        {isLoading ? (
          <div className="text-gray-500">{t.settings.profile.linkedAccountsTab.loading}</div>
        ) : (
          <div className="space-y-4">
            {/* Google */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold">G</span>
                </div>
                <div>
                  <div className="font-medium">{t.settings.profile.linkedAccountsTab.google.title}</div>
                  <div className="text-sm text-gray-500">
                    {t.settings.profile.linkedAccountsTab.google.description}
                  </div>
                </div>
              </div>
              {accounts?.find((acc: LinkedAccount) => acc.providerId === "google") ? (
                <button
                  onClick={() => {
                    const account = accounts.find((acc: LinkedAccount) => acc.providerId === "google");
                    if (account) handleUnlink(account.id, account.providerId);
                  }}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  {t.settings.profile.linkedAccountsTab.unlinkButton}
                </button>
              ) : (
                <button
                  onClick={handleLinkGoogle}
                  disabled={linkAccountMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {t.settings.profile.linkedAccountsTab.linkButton}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <SafeeToastContainer notifications={toast.notifications} onRemove={toast.removeToast} />
      <ConfirmModalComponent />
    </div>
  );
}

function DangerZoneTab() {
  const { t } = useTranslation();
  const toast = useToast();
  const { confirm, ConfirmModalComponent } = useConfirm();
  const deleteUserMutation = useDeleteUser();
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText !== "DELETE") {
      toast.error(t.settings.profile.dangerZoneTab.alerts.confirmTextMismatch);
      return;
    }

    const confirmed = await confirm({
      title: t.settings.profile.dangerZoneTab.title,
      message: t.settings.profile.dangerZoneTab.alerts.deleteConfirm,
      type: "danger",
      confirmText: t.settings.profile.dangerZoneTab.deleteButton,
    });

    if (!confirmed) return;

    try {
      await deleteUserMutation.mutateAsync(password);
      toast.success(t.settings.profile.dangerZoneTab.alerts.deleteSuccess);
      window.location.href = "/";
    } catch (err) {
      toast.error(t.settings.profile.dangerZoneTab.alerts.deleteFailed);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-2 flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          {t.settings.profile.dangerZoneTab.title}
        </h3>
        <p className="text-red-700 mb-6">{t.settings.profile.dangerZoneTab.warning}</p>

        <form onSubmit={handleDeleteAccount} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-red-900 mb-2">
              {t.settings.profile.dangerZoneTab.confirmPassword}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); }}
              className="w-full px-4 py-2 border border-red-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-red-900 mb-2">
              {t.settings.profile.dangerZoneTab.confirmText}{" "}
              <strong>{t.settings.profile.dangerZoneTab.confirmTextStrong}</strong>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => { setConfirmText(e.target.value); }}
              className="w-full px-4 py-2 border border-red-300 rounded-lg"
              placeholder={t.settings.profile.dangerZoneTab.confirmTextPlaceholder}
              required
            />
          </div>
          <button
            type="submit"
            disabled={deleteUserMutation.isPending}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {deleteUserMutation.isPending
              ? t.settings.profile.dangerZoneTab.deleting
              : t.settings.profile.dangerZoneTab.deleteButton}
          </button>
        </form>
      </div>
      <SafeeToastContainer notifications={toast.notifications} onRemove={toast.removeToast} />
      <ConfirmModalComponent />
    </div>
  );
}

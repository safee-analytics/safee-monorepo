"use client";

import React, { ReactNode, useState } from "react";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { useDirection } from "@/lib/hooks/useDirection";
import { SafeeLogo as SafeeLogoComponent } from "@/components/common/SafeeLogo";
import OtpInput from "react-otp-input";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { SearchableCountrySelect } from "./SearchableCountrySelect";

interface PhoneLoginFormProps {
  t: {
    title: string;
    subtitle: string;
    createAccount: string;
    goBack: string;
    phoneNumber: string;
    phoneNumberPlaceholder: string;
    sendCode: string;
    verifyCode: string;
    enterCode: string;
    codeDescription: string;
    resendCode: string;
    useEmail: string;
    signInWithGoogle: string;
    or: string;
    termsPrefix: string;
    termsLink: string;
    termsMiddle: string;
    privacyLink: string;
  };
  onSendCode?: (phoneNumber: string) => Promise<void>;
  onVerifyCode?: (phoneNumber: string, code: string) => Promise<void>;
  onGoogleLogin?: () => void;
  onGoBack?: () => void;
  onToggleEmailLogin?: () => void;
  isLoading?: boolean;
}

export const SafeePhoneLoginForm = ({
  t,
  onSendCode,
  onVerifyCode,
  onGoogleLogin,
  onGoBack,
  onToggleEmailLogin,
  isLoading,
}: PhoneLoginFormProps) => {
  const dir = useDirection();
  const isRTL = dir === "rtl";

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-20 text-gray-900 selection:bg-safee-200 min-h-screen relative overflow-hidden">
      <BubbleButton
        className={twMerge("absolute top-6 text-sm", isRTL ? "right-4" : "left-4")}
        onClick={onGoBack}
      >
        {isRTL ? <FiArrowRight /> : <FiArrowLeft />}
        {t.goBack}
      </BubbleButton>

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.25, ease: "easeInOut" }}
        className="relative z-10 mx-auto w-full max-w-xl p-4"
      >
        <Heading t={t} />
        <SocialOptions t={t} onGoogleLogin={onGoogleLogin} onToggleEmailLogin={onToggleEmailLogin} />
        <Or t={t} />
        <PhoneForm
          t={t}
          onSendCode={onSendCode}
          onVerifyCode={onVerifyCode}
          onToggleEmailLogin={onToggleEmailLogin}
          isLoading={isLoading}
        />
        <Terms t={t} />
      </motion.div>

      <CornerGrid isRTL={isRTL} />
    </div>
  );
};

const Heading = ({ t }: { t: PhoneLoginFormProps["t"] }) => (
  <div>
    <SafeeLogo />
    <div className="mb-9 mt-6 space-y-1.5">
      <h1 className="text-2xl font-semibold text-gray-900">{t.title}</h1>
      <p className="text-gray-600">
        {t.subtitle}{" "}
        <a href="/register" className="text-safee-600 hover:text-safee-700 transition-colors">
          {t.createAccount}
        </a>
      </p>
    </div>
  </div>
);

const SocialOptions = ({
  t,
  onGoogleLogin,
  onToggleEmailLogin,
}: {
  t: PhoneLoginFormProps["t"];
  onGoogleLogin?: () => void;
  onToggleEmailLogin?: () => void;
}) => (
  <div>
    <BubbleButton className="flex w-full justify-center py-3 mb-3" onClick={onGoogleLogin}>
      <FcGoogle className="text-xl" />
      {t.signInWithGoogle}
    </BubbleButton>
    <BubbleButton className="flex w-full justify-center py-3" onClick={onToggleEmailLogin}>
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
      {t.useEmail}
    </BubbleButton>
  </div>
);

const Or = ({ t }: { t: PhoneLoginFormProps["t"] }) => {
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-[1px] w-full bg-gray-300" />
      <span className="text-gray-500">{t.or}</span>
      <div className="h-[1px] w-full bg-gray-300" />
    </div>
  );
};

const PhoneForm = ({
  t,
  onSendCode,
  onVerifyCode,
  onToggleEmailLogin,
  isLoading,
}: {
  t: PhoneLoginFormProps["t"];
  onSendCode?: (phoneNumber: string) => Promise<void>;
  onVerifyCode?: (phoneNumber: string, code: string) => Promise<void>;
  onToggleEmailLogin?: () => void;
  isLoading?: boolean;
}) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  React.useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSendCode) {
      await onSendCode(phoneNumber);
      setCodeSent(true);
      setResendCountdown(60); // 60 second cooldown
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onVerifyCode) {
      await onVerifyCode(phoneNumber, otpCode);
    }
  };

  if (codeSent) {
    return (
      <form onSubmit={handleVerifyCode}>
        <div className="mb-6">
          <label className="mb-1.5 block text-gray-700">{t.enterCode}</label>
          <p className="text-sm text-gray-600 mb-4">
            {t.codeDescription} {phoneNumber}
          </p>

          <div className="flex justify-center mb-4">
            <OtpInput
              value={otpCode}
              onChange={setOtpCode}
              numInputs={6}
              renderSeparator={<span className="mx-2">-</span>}
              renderInput={(props) => (
                <input
                  {...props}
                  className="!w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-safee-500"
                />
              )}
            />
          </div>
        </div>

        <SplashButton type="submit" className="w-full mb-4" disabled={otpCode.length !== 6 || isLoading}>
          {isLoading ? "Verifying..." : t.verifyCode}
        </SplashButton>

        {/* Timer Display */}
        {resendCountdown > 0 ? (
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700">Resend code in {resendCountdown}s</span>
            </div>
          </div>
        ) : (
          <BubbleButton
            type="button"
            onClick={() => void handleSendCode({ preventDefault: () => {} } as React.FormEvent)}
            className="w-full justify-center py-3 mb-4"
            disabled={isLoading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {t.resendCode}
          </BubbleButton>
        )}

        <button
          type="button"
          onClick={() => {
            setCodeSent(false);
            setOtpCode("");
            setResendCountdown(0);
          }}
          className="w-full text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Change Number
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendCode}>
      <div className="mb-6">
        <label htmlFor="phone-input" className="mb-1.5 block text-gray-700">
          {t.phoneNumber}
        </label>
        <PhoneInput
          defaultCountry="QA"
          value={phoneNumber}
          onChange={(value) => {
            setPhoneNumber(value || "");
          }}
          placeholder={t.phoneNumberPlaceholder}
          className="phone-input-container w-full rounded-md border border-gray-300 bg-white placeholder-gray-400 focus:outline-0"
          numberInputProps={{
            className:
              "w-full rounded-md border-0 bg-transparent px-3 py-2 placeholder-gray-400 focus:outline-0 focus:ring-2 focus:ring-safee-500",
            required: true,
          }}
          countrySelectComponent={SearchableCountrySelect}
        />
      </div>

      <SplashButton type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Sending..." : t.sendCode}
      </SplashButton>
    </form>
  );
};

const Terms = ({ t }: { t: PhoneLoginFormProps["t"] }) => (
  <p className="mt-9 text-xs text-gray-600">
    {t.termsPrefix}{" "}
    <a href="/terms" className="text-safee-600 hover:text-safee-700 transition-colors">
      {t.termsLink}
    </a>{" "}
    {t.termsMiddle}{" "}
    <a href="/privacy" className="text-safee-600 hover:text-safee-700 transition-colors">
      {t.privacyLink}
    </a>
  </p>
);

const SplashButton = ({ children, className, disabled, ...rest }: ButtonProps) => {
  return (
    <button
      disabled={disabled}
      className={twMerge(
        "rounded-md bg-gradient-to-br from-safee-400 to-safee-700 px-4 py-2 text-lg text-zinc-50 ring-2 ring-safee-500/50 ring-offset-2 ring-offset-gray-50 transition-all hover:scale-[1.02] hover:ring-transparent active:scale-[0.98] active:ring-safee-500/70 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
};

const BubbleButton = ({ children, className, ...rest }: ButtonProps) => {
  return (
    <button
      className={twMerge(
        `
        relative z-0 flex items-center gap-2 overflow-hidden whitespace-nowrap rounded-md
        border border-gray-300 bg-gradient-to-br from-white to-gray-50
        px-3 py-1.5
        text-gray-900 transition-all duration-300

        before:absolute before:inset-0
        before:-z-10 before:translate-y-[200%]
        before:scale-[2.5]
        before:rounded-[100%] before:bg-safee-100
        before:transition-transform before:duration-500
        before:content-[""]

        hover:scale-105 hover:text-safee-900
        hover:before:translate-y-[0%]
        active:scale-100`,
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
};

const CornerGrid = ({ isRTL }: { isRTL: boolean }) => {
  return (
    <div
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke-width='2' stroke='rgb(59 130 246 / 0.3)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
      }}
      className={twMerge("absolute top-0 z-0 size-[50vw]", isRTL ? "left-0" : "right-0")}
    >
      <div
        style={{
          backgroundImage: isRTL
            ? "radial-gradient(100% 100% at 0% 0%, rgba(249,250,251,0), rgba(249,250,251,1))"
            : "radial-gradient(100% 100% at 100% 0%, rgba(249,250,251,0), rgba(249,250,251,1))",
        }}
        className="absolute inset-0"
      />
    </div>
  );
};

const SafeeLogo = () => {
  return (
    <div className="flex items-center gap-3">
      <SafeeLogoComponent size="lg" />
    </div>
  );
};

type ButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default SafeePhoneLoginForm;

"use client";

import React, { ReactNode } from "react";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { useDirection } from "@/lib/hooks/useDirection";
import { SafeeLogo as SafeeLogoComponent } from "@/components/common/SafeeLogo";

interface LoginFormProps {
  t: {
    title: string;
    subtitle: string;
    createAccount: string;
    goBack: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    forgotPassword: string;
    signIn: string;
    signInWithGoogle: string;
    signInWithSSO: string;
    signInWithMagicLink?: string;
    useMagicLink?: string;
    usePassword?: string;
    or: string;
    termsPrefix: string;
    termsLink: string;
    termsMiddle: string;
    privacyLink: string;
  };
  onSubmit?: (email: string, password: string) => void;
  onGoogleLogin?: () => void;
  onSSOLogin?: () => void;
  onGoBack?: () => void;
  onSendMagicLink?: (email: string) => void;
  useMagicLinkMode?: boolean;
  onToggleMagicLink?: () => void;
}

export const SafeeLoginForm = ({
  t,
  onSubmit,
  onGoogleLogin,
  onSSOLogin,
  onGoBack,
  onSendMagicLink,
  useMagicLinkMode,
  onToggleMagicLink,
}: LoginFormProps) => {
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
        <SocialOptions t={t} onGoogleLogin={onGoogleLogin} onSSOLogin={onSSOLogin} />
        <Or t={t} />
        <EmailForm
          t={t}
          onSubmit={onSubmit}
          onSendMagicLink={onSendMagicLink}
          useMagicLinkMode={useMagicLinkMode}
          onToggleMagicLink={onToggleMagicLink}
        />
        <Terms t={t} />
      </motion.div>

      <CornerGrid isRTL={isRTL} />
    </div>
  );
};

const Heading = ({ t }: { t: LoginFormProps["t"] }) => (
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
  onSSOLogin,
}: {
  t: LoginFormProps["t"];
  onGoogleLogin?: () => void;
  onSSOLogin?: () => void;
}) => (
  <div>
    <BubbleButton className="flex w-full justify-center py-3 mb-3" onClick={onGoogleLogin}>
      <FcGoogle className="text-xl" />
      {t.signInWithGoogle}
    </BubbleButton>
    <BubbleButton className="flex w-full justify-center py-3" onClick={onSSOLogin}>
      {t.signInWithSSO}
    </BubbleButton>
  </div>
);

const Or = ({ t }: { t: LoginFormProps["t"] }) => {
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-[1px] w-full bg-gray-300" />
      <span className="text-gray-500">{t.or}</span>
      <div className="h-[1px] w-full bg-gray-300" />
    </div>
  );
};

const EmailForm = ({
  t,
  onSubmit,
  onSendMagicLink,
  useMagicLinkMode,
  onToggleMagicLink,
}: {
  t: LoginFormProps["t"];
  onSubmit?: (email: string, password: string) => void;
  onSendMagicLink?: (email: string) => void;
  useMagicLinkMode?: boolean;
  onToggleMagicLink?: () => void;
}) => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (useMagicLinkMode) {
      onSendMagicLink?.(email);
    } else {
      onSubmit?.(email, password);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label htmlFor="email-input" className="mb-1.5 block text-gray-700">
          {t.email}
        </label>
        <input
          id="email-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.emailPlaceholder}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 placeholder-gray-400 ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-safee-500"
          required
        />
      </div>

      {!useMagicLinkMode && (
        <div className="mb-6">
          <div className="mb-1.5 flex items-end justify-between">
            <label htmlFor="password-input" className="block text-gray-700">
              {t.password}
            </label>
            <a
              href="/forgot-password"
              className="text-sm text-safee-600 hover:text-safee-700 transition-colors"
            >
              {t.forgotPassword}
            </a>
          </div>
          <input
            id="password-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.passwordPlaceholder}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 placeholder-gray-400 ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-safee-500"
            required
          />
        </div>
      )}

      <SplashButton type="submit" className="w-full mb-3">
        {useMagicLinkMode ? t.signInWithMagicLink : t.signIn}
      </SplashButton>

      {onToggleMagicLink && (
        <button
          type="button"
          onClick={onToggleMagicLink}
          className="w-full text-sm text-safee-600 hover:text-safee-700 transition-colors"
        >
          {useMagicLinkMode ? t.usePassword : t.useMagicLink}
        </button>
      )}
    </form>
  );
};

const Terms = ({ t }: { t: LoginFormProps["t"] }) => (
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

const SplashButton = ({ children, className, ...rest }: ButtonProps) => {
  return (
    <button
      className={twMerge(
        "rounded-md bg-gradient-to-br from-safee-400 to-safee-700 px-4 py-2 text-lg text-zinc-50 ring-2 ring-safee-500/50 ring-offset-2 ring-offset-gray-50 transition-all hover:scale-[1.02] hover:ring-transparent active:scale-[0.98] active:ring-safee-500/70",
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
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default SafeeLoginForm;

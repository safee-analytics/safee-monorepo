"use client";

import { useState } from "react";
import { Phone, ArrowRight } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import OtpInput from "react-otp-input";
import { useToast, SafeeToastContainer } from "@/components/feedback";
import { useSendPhoneVerification, useVerifyPhoneNumber } from "@/lib/api/hooks";

interface PhoneAuthFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PhoneAuthForm({ onSuccess, onCancel }: PhoneAuthFormProps) {
  const toast = useToast();
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");

  const sendVerificationMutation = useSendPhoneVerification();
  const verifyPhoneMutation = useVerifyPhoneNumber();

  const handleSendCode = async () => {
    if (!phoneNumber) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    try {
      await sendVerificationMutation.mutateAsync(phoneNumber);
      setStep("verify");
    } catch (err) {
      toast.error("Failed to send verification code. Please try again.");
      console.error("Phone verification error:", err);
    }
  };

  const handleVerifyAndSignIn = async () => {
    try {
      await verifyPhoneMutation.mutateAsync({
        phoneNumber,
        code: verificationCode,
      });
      onSuccess?.();
    } catch (err) {
      toast.error("Invalid verification code. Please try again.");
      setVerificationCode("");
      console.error("Phone verification error:", err);
    }
  };

  return (
    <div className="space-y-4">
      {step === "phone" ? (
        <>
          <div className="flex items-center gap-2 mb-4">
            <Phone className="w-5 h-5 text-safee-600" />
            <h3 className="text-lg font-semibold text-gray-900">Sign in with Phone</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <PhoneInput
              international
              defaultCountry="EG"
              value={phoneNumber}
              onChange={(value) => {
                setPhoneNumber(value || "");
              }}
              className="phone-input-custom"
              numberInputProps={{
                className:
                  "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safee-500 focus:border-transparent",
              }}
            />
            <p className="text-xs text-gray-500 mt-1">We&apos;ll send you a verification code via SMS</p>
          </div>

          <div className="flex gap-2">
            {onCancel && (
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              onClick={() => {
                void handleSendCode();
              }}
              disabled={!phoneNumber || sendVerificationMutation.isPending}
              className="flex-1 px-4 py-2 bg-safee-600 text-white rounded-lg hover:bg-safee-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sendVerificationMutation.isPending ? "Sending..." : "Send Code"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4">
            <Phone className="w-5 h-5 text-safee-600" />
            <h3 className="text-lg font-semibold text-gray-900">Enter Verification Code</h3>
          </div>

          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Code sent to: <span className="font-medium">{phoneNumber}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">6-Digit Verification Code</label>
            <div className="flex justify-center">
              <OtpInput
                value={verificationCode}
                onChange={setVerificationCode}
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

          <button
            onClick={() => {
              void handleVerifyAndSignIn();
            }}
            disabled={verificationCode.length !== 6 || verifyPhoneMutation.isPending}
            className="w-full px-4 py-2 bg-safee-600 text-white rounded-lg hover:bg-safee-700 disabled:opacity-50"
          >
            {verifyPhoneMutation.isPending ? "Verifying..." : "Verify & Sign In"}
          </button>

          <button
            onClick={() => {
              setStep("phone");
              setVerificationCode("");
            }}
            className="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
          >
            Change phone number
          </button>
        </>
      )}

      <style jsx global>{`
        .phone-input-custom {
          width: 100%;
        }
        .phone-input-custom .PhoneInputInput {
          width: 100%;
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 1rem;
          transition: all 0.2s;
        }
        .phone-input-custom .PhoneInputInput:focus {
          outline: none;
          ring: 2px;
          ring-color: #4f46e5;
          border-color: transparent;
        }
        .phone-input-custom .PhoneInputCountry {
          margin-right: 0.5rem;
        }
      `}</style>
      <SafeeToastContainer notifications={toast.notifications} onRemove={toast.removeToast} />
    </div>
  );
}

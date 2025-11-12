"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ForgotPasswordStep from "./ForgotPassword";
import VerifyOtpStep from "./VerifyOtp";
import CreateNewPasswordStep from "./CreateNewPassword";
import PasswordResetSuccessStep from "./PasswordResetSuccess";



export default function ForgotPasswordFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

   return (
    <>
      {step === 1 && (
        <ForgotPasswordStep
          onContinue={(enteredEmail: string) => {
            setEmail(enteredEmail);
            setStep(2);
          }}
        />
      )}
      {step === 2 && (
        <VerifyOtpStep
          onVerify={(enteredOtp: string) => {
            setOtp(enteredOtp);
            setStep(3);
          }}
        />
      )}
      {step === 3 && (
        <CreateNewPasswordStep
          onContinue={() => setStep(4)}
          email={email}
          otp={otp}
        />
      )}
      {step === 4 && (
        <PasswordResetSuccessStep onLogin={() => router.push('/')} />
      )}
    </>
  );
}
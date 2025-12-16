
import { Metadata } from "next";
import { FiscalClient } from "./_components/fiscal-client";

export const metadata: Metadata = {
  title: "Fiscal",
  description: "Gestão e conferência de documentos e apurações fiscais.",
};

export default function FiscalPage() {
  return <FiscalClient />;
}

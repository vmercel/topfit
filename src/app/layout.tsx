import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TopFit: Interview Prep That Puts You in the Top 3 Percent",
  description:
    "Add your resume and a job description. TopFit decodes the role, picks the 4 questions your interview stage is most likely to ask, engineers brief answers from your own experience, and predicts the follow-ups.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#F7F6F2]">
        <Nav />
        {children}
      </body>
    </html>
  );
}

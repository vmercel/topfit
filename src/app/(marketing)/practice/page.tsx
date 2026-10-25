import type { Metadata } from 'next';
import CodingPractice from '@/components/CodingPractice';
export const metadata: Metadata = {
  title: 'Coding Practice: Python 75 & SQL Engineering | TopFit',
  description: 'Understand patterns, explore worked solutions, and practice 75 Python interview problems and 40 SQL patterns with runnable tests.',
};
export default function PracticePage() { return <CodingPractice />; }

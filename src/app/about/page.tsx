'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            O nas
          </h1>
          <div className="h-1 w-20 bg-primary-500 mx-auto rounded-full"></div>
        </div>

        <div className="prose prose-lg mx-auto text-gray-600 space-y-6">
          <p>
            Jesteśmy grupą studentów, którzy stworzyli tę aplikację jako projekt poboczny. 
            Wszystko zaczęło się od prostego pomysłu — chcieliśmy znaleźć lepszy sposób na 
            robienie notatek z wykładów online, szczególnie gdy czas nas gonił przed egzaminami.
          </p>

          <p>
            Na początku to był tylko skrypt, który pomagał nam przetwarzać nagrania z zajęć. 
            Ale z czasem pomyśleliśmy: "Skoro nam to pomaga, może przyda się też innym?". 
            I tak narodził się EduScribe.
          </p>

          <p>
            Po wielu nieprzespanych nocach spędzonych na debugowaniu (i niekończących się 
            dyskusjach o rozmiarach czcionek o 2 nad ranem), udało nam się stworzyć coś, 
            z czego jesteśmy naprawdę dumni.
          </p>

          <p>
            Mamy nadzieję, że ta aplikacja ułatwi komuś życie — czy to podczas przygotowań 
            do matury, nauki nowego języka, czy po prostu próby ogarnięcia materiału z zajęć. 
            Dziękujemy, że jesteście z nami w tej podróży.
          </p>

          <div className="border-l-4 border-primary-500 pl-4 my-8 py-2">
            <p className="text-gray-700 italic">
              "Najlepsze pomysły rodzą się z próby rozwiązania własnych problemów."
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link href="/">
            <Button variant="secondary" className="inline-flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Powrót do strony głównej
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
} 
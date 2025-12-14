import { MapPin, Phone, Clock, Train, Car } from "lucide-react";
import Image from "next/image";
import ContactForm from "@/components/ContactForm";

export default function ContactPage() {
  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold mb-4">Contact & Application</h2>
            <p className="text-gray-500">강의 및 프로젝트 관련 문의사항을 남겨주세요.</p>
        </div>
        
        <ContactForm />
      </div>
    </div>
  );
}

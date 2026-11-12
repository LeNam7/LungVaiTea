'use client';

import FacebookIcon from "@/components/icons/FacebookIcon";
import IgIcon from "@/components/icons/IgIcon";
import TiktokIcon from "@/components/icons/TiktokIcon";
import React from "react";
import FadeInUp from "@/components/animations/FadeInUp";
import ContactForm from "@/components/common/ContactForm";
import AbsoluteBackground from "@/components/common/AbsoluteBackground";
import {BRAND, BRAND_INTRO} from "@/constants/brand";
import {useLanguage} from "@/context/LanguageContext";

const mapEmbedSrc = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4205.408456803734!2d105.77040567565864!3d20.984373689300817!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x313453004d4e453d%3A0x91638f4a1dbe227!2zU2VlbWUgLSB24buLIHRyw6AgY-G7lQ!5e1!3m2!1svi!2s!4v1783344514138!5m2!1svi!2s";

const Page = () => {
  const { t } = useLanguage();
  const address = t('brand.address', BRAND.address);

  return (
    <div className="relative overflow-hidden bg-[#DBCFB9]">
      <AbsoluteBackground src="/images/bg-contact.png" className="object-top" />
      <div className="relative z-10 px-4 sm:px-10 lg:px-16 pt-[22px] pb-[67px] gap-[33px] flex flex-col">
        <FadeInUp>
          <p className="text-sm text-[#3B5518]">{t('contact.breadcrumb', 'Home / Liên hệ')}</p>
        </FadeInUp>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <FadeInUp
            delay={0.1}
            className="w-full flex flex-col gap-2 text-[#7F9635]"
          >
            <h1 className="font-source-serif-4 text-[30px] leading-none text-[#3B5518]">
              {t('brand.name', BRAND.name)}
            </h1>
            <div className="w-full flex flex-col gap-[5px] mt-1 text-base leading-5">
              <div className="flex gap-3">
                <p className="w-[72px] shrink-0">{t('contact.addressLabel', 'Địa chỉ:')}</p>
                <p>{address}</p>
              </div>
              <div className="flex gap-3">
                <p className="w-[72px] shrink-0">{t('contact.hotlineLabel', 'Hotline:')}</p>
                <p>{BRAND.phoneDisplay}</p>
              </div>
              <div className="flex gap-3">
                <p className="w-[72px] shrink-0">{t('contact.mailLabel', 'Mail:')}</p>
                <p>{BRAND.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <a href={BRAND.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><FacebookIcon /></a>
              <a href={BRAND.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><IgIcon /></a>
              <a href={BRAND.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok"><TiktokIcon /></a>
            </div>
            <h2 className="font-source-serif-4 text-[30px] leading-none text-[#3B5518] mt-[27px]">
              {t('contact.contactUs', 'Liên hệ với chúng tôi')}
            </h2>
            <p className="w-full max-w-xl leading-6">{t('contact.brandIntro', BRAND_INTRO)}</p>
            <ContactForm buttonText={t('contact.sendContact', 'Gửi liên hệ')} textareaRows={5} />
          </FadeInUp>
          <FadeInUp delay={0.2} className="w-full">
            <iframe
              src={mapEmbedSrc}
              title="Google Maps"
              className="w-full h-[380px] rounded-[6px] sm:h-[460px] lg:h-[600px] xl:h-[660px]"
              style={{border: 0}}
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </FadeInUp>
        </div>
      </div>
    </div>
  );
};

export default Page;

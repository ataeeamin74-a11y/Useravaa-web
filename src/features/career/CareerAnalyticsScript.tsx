import Script from "next/script";

export function CareerAnalyticsScript() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  if (!measurementId) return null;
  const encodedMeasurementId = encodeURIComponent(measurementId);
  const serializedMeasurementId = JSON.stringify(measurementId);

  return (
    <>
      <Script
        id="career-ga4-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodedMeasurementId}`}
        strategy="afterInteractive"
      />
      <Script id="career-ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', ${serializedMeasurementId}, { send_page_view: false });
        `}
      </Script>
    </>
  );
}

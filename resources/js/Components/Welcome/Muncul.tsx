import { ReactNode, useEffect, useRef, useState } from 'react';

/**
 * Isi muncul pelan (memudar sambil naik sedikit) saat pertama kali masuk layar.
 * Tanpa IntersectionObserver (browser lama) isi langsung tampil.
 */
export default function Muncul({ children, jeda = 0, className = '' }: { children: ReactNode; jeda?: number; className?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [terlihat, setTerlihat] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el || typeof IntersectionObserver === 'undefined') {
            setTerlihat(true);
            return;
        }
        const pengamat = new IntersectionObserver(
            ([entri]) => {
                if (entri.isIntersecting) {
                    setTerlihat(true);
                    pengamat.disconnect();
                }
            },
            { threshold: 0.15 },
        );
        pengamat.observe(el);
        return () => pengamat.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${jeda}ms` }}
            className={`transition duration-700 ease-out motion-reduce:transition-none ${terlihat ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'} ${className}`}
        >
            {children}
        </div>
    );
}

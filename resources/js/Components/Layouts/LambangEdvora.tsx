/**
 * Lambang EDVORA tanpa tulisan. Berkas logo memuat lambang beserta tulisan EDVORA;
 * desain hanya memakai lambangnya, jadi dipotong seperti di Figma.
 * Ukuran diatur lewat className (perbandingan lebar:tinggi lambang ±38:45).
 */
export default function LambangEdvora({ className = 'h-[45px] w-[38px]' }: { className?: string }) {
    return (
        <div className={`relative shrink-0 overflow-hidden ${className}`}>
            <img src="/images/ikon/logo-edvora.png" alt="" className="absolute left-[-48.38%] top-0 h-[126.6%] w-[197.18%] max-w-none" />
        </div>
    );
}

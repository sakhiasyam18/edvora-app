export default function FeaturesSection() {
    return (
        <main className="w-full bg-gradient-to-b from-[#9DC5EE] via-[#7DAAE4] to-[#5B88DD] flex-1 pb-20 pt-10 px-4 sm:px-6 lg:px-8" data-purpose="main-content-section">
            <div className="max-w-6xl mx-auto">
                {/* Introductory Paragraph */}
                <div className="max-w-4xl mx-auto text-center mb-10 sm:mb-14">
                    <p className="text-white text-xs sm:text-sm md:text-base leading-relaxed sm:leading-normal font-normal opacity-95 antialiased drop-shadow-sm px-2">
                        Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.
                    </p>
                </div>

                {/* Feature Cards Container */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto" data-purpose="feature-cards-grid" id="fitur">
                    {/* Card 1 */}
                    <article className="bg-white rounded-3xl p-8 sm:p-10 shadow-lg hover:shadow-2xl transition-all duration-300 min-h-[220px] sm:min-h-[260px] md:min-h-[300px] flex items-center justify-center border border-white/60 group hover:-translate-y-1.5 cursor-pointer">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#28488E] tracking-wider group-hover:text-[#5B88DD] transition-colors uppercase select-none">
                            FITUR
                        </h2>
                    </article>

                    {/* Card 2 */}
                    <article className="bg-white rounded-3xl p-8 sm:p-10 shadow-lg hover:shadow-2xl transition-all duration-300 min-h-[220px] sm:min-h-[260px] md:min-h-[300px] flex items-center justify-center border border-white/60 group hover:-translate-y-1.5 cursor-pointer">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#28488E] tracking-wider group-hover:text-[#5B88DD] transition-colors uppercase select-none">
                            FITUR
                        </h2>
                    </article>

                    {/* Card 3 */}
                    <article className="bg-white rounded-3xl p-8 sm:p-10 shadow-lg hover:shadow-2xl transition-all duration-300 min-h-[220px] sm:min-h-[260px] md:min-h-[300px] flex items-center justify-center border border-white/60 group hover:-translate-y-1.5 cursor-pointer">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#28488E] tracking-wider group-hover:text-[#5B88DD] transition-colors uppercase select-none">
                            FITUR
                        </h2>
                    </article>
                </div>
            </div>
        </main>
    );
}

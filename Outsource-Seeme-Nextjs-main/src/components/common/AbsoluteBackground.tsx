type AbsoluteBackgroundProps = {
    src: string;
    alt?: string;
    className?: string;
};

const AbsoluteBackground = ({src, alt = '', className = ''}: AbsoluteBackgroundProps) => {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt={alt}
            aria-hidden={alt ? undefined : true}
            className={`pointer-events-none absolute inset-0 z-0 h-full w-full object-cover ${className}`}
        />
    );
};

export default AbsoluteBackground;

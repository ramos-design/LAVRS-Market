import React from 'react';

interface HeartLoaderProps {
    size?: number;
    className?: string;
    strokeWidth?: number;
}

const HEART_PATH =
    'M12 21s-6.716-4.35-9.192-7.232C.404 11.09.682 6.95 3.38 4.56c2.3-2.04 5.8-1.8 7.95.55L12 5.84l.67-.73c2.15-2.35 5.65-2.59 7.95-.55 2.698 2.39 2.976 6.53.572 9.208C18.716 16.65 12 21 12 21z';

const HeartLoader: React.FC<HeartLoaderProps> = ({ size = 20, className = '', strokeWidth = 1.8 }) => {
    return (
        <span
            className={`heart-loader ${className}`.trim()}
            style={{ width: size, height: size }}
            aria-hidden="true"
        >
            <svg className="heart-loader-svg" viewBox="0 0 24 24" fill="none" role="presentation">
                <path
                    d={HEART_PATH}
                    className="heart-loader-base"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d={HEART_PATH}
                    className="heart-loader-trace"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </span>
    );
};

export default HeartLoader;

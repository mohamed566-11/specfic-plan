import React, { useState, useEffect, useRef } from 'react';

interface ProgressRobotProps {
    currentStep: number;
    totalSteps: number;
    stepTitle: string;
    stepOf: string;
    isRTL: boolean;
    onStepClick: (step: number) => void;
}

export const ProgressRobot: React.FC<ProgressRobotProps> = ({
    currentStep,
    totalSteps,
    stepTitle,
    stepOf,
    isRTL,
    onStepClick,
}) => {
    const progress = ((currentStep + 1) / totalSteps) * 100;
    const [animState, setAnimState] = useState<'idle' | 'running' | 'celebrating'>('idle');

    const prevStepRef = useRef(currentStep);
    const runTimerRef = useRef<number | null>(null);
    const celebrateTimerRef = useRef<number | null>(null);

    useEffect(() => {
        if (currentStep === prevStepRef.current) return;
        prevStepRef.current = currentStep;

        if (runTimerRef.current) { window.clearTimeout(runTimerRef.current); runTimerRef.current = null; }
        if (celebrateTimerRef.current) { window.clearTimeout(celebrateTimerRef.current); celebrateTimerRef.current = null; }

        setAnimState('running');

        runTimerRef.current = window.setTimeout(() => {
            runTimerRef.current = null;
            setAnimState('celebrating');

            celebrateTimerRef.current = window.setTimeout(() => {
                celebrateTimerRef.current = null;
                setAnimState('idle');
            }, 4000);
        }, 500);

        return () => {
            if (runTimerRef.current) window.clearTimeout(runTimerRef.current);
            if (celebrateTimerRef.current) window.clearTimeout(celebrateTimerRef.current);
        };
    }, [currentStep]);

    const isCelebrating = animState === 'celebrating';
    const isRunning = animState === 'running';

    return (
        <div className="mb-6 sm:mb-8">
            {/* Step counter */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-primary-700 bg-primary-100 px-3 py-1 rounded-full">
                    {currentStep + 1} {stepOf} {totalSteps}
                </span>
                <span className="text-sm font-semibold text-gray-500">{Math.round(progress)}%</span>
            </div>

            {/* Progress track with robot */}
            <div className="relative pt-16 pb-2">
                {/* Robot container */}
                <div
                    className="absolute top-0 z-20 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                    style={{
                        [isRTL ? 'right' : 'left']: `calc(${progress}% - 22px)`,
                    }}
                >
                    {/* Robot SVG */}
                    <div
                        className="robot-character"
                        style={{
                            animation: isRunning
                                ? 'robotBounce 0.3s ease-in-out infinite'
                                : isCelebrating
                                    ? 'robotHop 0.8s ease-in-out infinite'
                                    : 'none',
                        }}
                    >
                        <svg width="44" height="56" viewBox="0 0 44 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Antenna */}
                            <line x1="22" y1="7" x2="22" y2="1" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="22" cy="1.5" r="2" fill={isCelebrating ? '#fbbf24' : '#4ade80'} />

                            {/* Head */}
                            <ellipse cx="22" cy="17" rx="14" ry="12" fill="#a8d5b0" />
                            <ellipse cx="22" cy="16.5" rx="13" ry="11" fill="#c8e6ce" />
                            <ellipse cx="22" cy="15" rx="10" ry="7" fill="#dff0e2" opacity="0.7" />

                            {/* Left goggle */}
                            <circle cx="15" cy="17" r="6.5" fill="#4a7a52" />
                            <circle cx="15" cy="17" r="5.5" fill="#2d5e38" />
                            <circle cx="15" cy="17" r="4.5" fill="#f0fdf4" />
                            {isCelebrating ? (
                                <path d="M12 17 Q15 14 18 17" stroke="#1a3d24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                            ) : (
                                <>
                                    <circle cx="15" cy="17" r="2.5" fill="#1a3d24">
                                        {isRunning && <animate attributeName="cx" values="15;17;15" dur="0.3s" repeatCount="indefinite" />}
                                    </circle>
                                    <circle cx="14" cy="16" r="0.8" fill="white" opacity="0.9" />
                                </>
                            )}

                            {/* Bridge */}
                            <rect x="19" y="15.5" width="6" height="3" rx="1.5" fill="#4a7a52" />

                            {/* Right goggle */}
                            <circle cx="29" cy="17" r="6.5" fill="#4a7a52" />
                            <circle cx="29" cy="17" r="5.5" fill="#2d5e38" />
                            <circle cx="29" cy="17" r="4.5" fill="#f0fdf4" />
                            {isCelebrating ? (
                                <path d="M26 17 Q29 14 32 17" stroke="#1a3d24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                            ) : (
                                <>
                                    <circle cx="29" cy="17" r="2.5" fill="#1a3d24">
                                        {isRunning && <animate attributeName="cx" values="29;31;29" dur="0.3s" repeatCount="indefinite" />}
                                    </circle>
                                    <circle cx="28" cy="16" r="0.8" fill="white" opacity="0.9" />
                                </>
                            )}

                            {/* Mouth */}
                            {isCelebrating
                                ? <path d="M18 23 Q22 26 26 23" stroke="#2d5e38" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                                : <ellipse cx="22" cy="23.5" rx="3" ry="1" fill="#7ab889" />
                            }

                            {/* Neck */}
                            <rect x="19" y="27" width="6" height="3" rx="1" fill="#a0cfac" />

                            {/* Body */}
                            <ellipse cx="22" cy="37" rx="10" ry="8" fill="#a8d5b0" />
                            <ellipse cx="22" cy="36.5" rx="9" ry="7" fill="#c8e6ce" />
                            <ellipse cx="22" cy="35" rx="3" ry="2.5" fill="#e8f5e9" opacity="0.8" />

                            {/* Arms */}
                            <g>
                                <ellipse cx="10" cy="33" rx="3" ry="2.5" fill="#a8d5b0" />
                                <rect x="5" y="33" width="5" height="7" rx="2.5" fill="#bad9c2" />
                                <ellipse cx="7.5" cy="41" rx="2.5" ry="2" fill="#a8d5b0" />
                            </g>
                            <g>
                                <ellipse cx="34" cy="33" rx="3" ry="2.5" fill="#a8d5b0" />
                                <rect x="34" y="33" width="5" height="7" rx="2.5" fill="#bad9c2" />
                                <ellipse cx="36.5" cy="41" rx="2.5" ry="2" fill="#a8d5b0" />
                            </g>

                            {/* Legs */}
                            <g>
                                <rect x="15" y="43" width="5" height="7" rx="2.5" fill="#a8d5b0" />
                                <rect x="13.5" y="49" width="7" height="3" rx="1.5" fill="#bad9c2" />
                            </g>
                            <g>
                                <rect x="24" y="43" width="5" height="7" rx="2.5" fill="#a8d5b0" />
                                <rect x="23.5" y="49" width="7" height="3" rx="1.5" fill="#bad9c2" />
                            </g>
                        </svg>
                    </div>
                </div>

                {/* Track */}
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Step dots */}
            <div className="flex justify-between mt-2 px-1">
                {Array.from({ length: totalSteps }).map((_, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => onStepClick(i)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 hover:scale-150 ${i === currentStep
                                ? 'bg-primary-500 scale-125 shadow-md shadow-primary-200 ring-2 ring-primary-200'
                                : i < currentStep
                                    ? 'bg-primary-400'
                                    : 'bg-gray-300'
                            }`}
                        title={stepTitle}
                    />
                ))}
            </div>
        </div>
    );
};

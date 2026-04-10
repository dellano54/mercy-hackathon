import Spline from '@splinetool/react-spline';

export default function SplineBackground() {
  return (
    <div className="absolute inset-0 -z-10 w-full h-full bg-[#f5f5f7]">
      {/* Fallback gradient if Spline is slow to load */}
      <div className="absolute inset-0 bg-radial-gradient from-white via-[#f5f5f7] to-[#e5e5e7] opacity-50" />
      <Spline 
        scene="https://prod.spline.design/6Wq1Q7YIn9vYm82i/scene.splinecode" 
        className="w-full h-full"
      />
    </div>
  );
}

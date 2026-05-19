import Lottie from "lottie-react";
import loadingData from "./loading.json";
import { motion } from "framer-motion";

export function LoadingAnimation() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-80 h-80 sm:w-96 sm:h-96"
      >
        <Lottie animationData={loadingData} loop={true} />
      </motion.div>
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 flex flex-col items-center gap-2"
      >
        <h3 className="text-xl font-bold text-gradient animate-pulse">
          {/* Loading Leaderboard */}
        </h3>
        <p className="text-sm text-muted-foreground uppercase tracking-[0.3em]">
          God's Own Gaming Country
        </p>
      </motion.div>
    </motion.div>
  );
}

import { motion } from "framer-motion";

function Hero() {
  return (
    <section className="relative flex items-center justify-center min-h-[75vh] overflow-hidden bg-linear-to-b from-[#07111f] to-[#0B1120]">

      <div className="absolute w-175 h-175 bg-cyan-500/20 blur-[160px] rounded-full"></div>

      <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">

        <motion.h1
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="text-5xl md:text-[7rem] font-black text-cyan-400 tracking-[10px] leading-none"
        >
          RETRIVIUM
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xl md:text-3xl text-gray-300 mt-8 max-w-4xl mx-auto leading-relaxed"
        >
          Intelligent Campus Recovery Network designed to reconnect students with their lost belongings through smart digital reporting and match detection.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex flex-wrap justify-center gap-6 mt-12"
        >

          <button className="px-10 py-5 bg-cyan-400 text-black rounded-2xl font-bold text-lg hover:scale-105 hover:shadow-cyan-500/50 hover:shadow-2xl transition duration-300">
            Report Lost Item
          </button>

          <button className="px-10 py-5 border border-cyan-400 text-cyan-400 rounded-2xl font-bold text-lg hover:bg-cyan-400 hover:text-black transition duration-300">
            Report Found Item
          </button>

        </motion.div>

      </div>
    </section>
  );
}

export default Hero;
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";

interface SuccessModalProps {
  open: boolean;

  onClose: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ open, onClose }) => {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="bg-white rounded-xl shadow-xl p-6 w-96 text-center"
          >
            <div className="flex flex-col justify-center items-center">
              {" "}
              <Icon
                icon="ooui:success"
                color="#36BF32"
                width="50"
                height="50"
              />
              <h2 className="text-2xl font-bold text-green-600">
                อนุมัติสำเร็จ
              </h2>
              <p className="mt-2 text-gray-600">
                คำขอผลิตงานของคุณได้รับการอนุมัติแล้ว
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              ปิด
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SuccessModal;

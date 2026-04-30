import { useState } from 'react';
import { Play, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

export function VideoSection() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <>
      <div className="relative mt-8 group cursor-pointer" onClick={() => setIsPlaying(true)}>
        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
          <div className="aspect-video bg-gradient-to-br from-[var(--teal-200)] to-[var(--teal-400)] flex items-center justify-center">
            <div className="absolute inset-0 bg-[var(--navy-900)]/20"></div>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                <Play className="w-10 h-10 text-[var(--navy-900)] ml-1" fill="currentColor" />
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
              <h3 className="text-white text-xl mb-1">See how Verilearn works</h3>
              <p className="text-white/90 text-sm">Watch our 2-minute introduction to personalized learning</p>
            </div>
          </div>
        </div>

        <div className="absolute -inset-1 bg-gradient-to-r from-[var(--teal-300)] to-[var(--teal-400)] rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
      </div>

      <Dialog.Root open={isPlaying} onOpenChange={setIsPlaying}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-5xl animate-in zoom-in-95 fade-in">
            <Dialog.Title className="sr-only">Verilearn Introduction Video</Dialog.Title>
            <Dialog.Description className="sr-only">
              Watch our introduction video to learn how Verilearn connects students with expert tutors
            </Dialog.Description>

            <div className="relative">
              <Dialog.Close className="absolute -top-12 right-0 text-white hover:text-[var(--teal-300)] transition-colors">
                <X className="w-8 h-8" />
              </Dialog.Close>

              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <div className="aspect-video bg-black">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                    title="Verilearn Introduction"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

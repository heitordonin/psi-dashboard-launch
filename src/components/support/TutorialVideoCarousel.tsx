import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { PlayCircleIcon } from 'lucide-react';

interface TutorialVideo {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
}

interface TutorialVideoCarouselProps {
  videos: TutorialVideo[];
}

const TutorialVideoCarousel: React.FC<TutorialVideoCarouselProps> = ({ videos }) => {
  return (
    <div className="max-w-2xl mx-auto mb-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircleIcon className="w-5 h-5" style={{ color: '#002472' }} />
            Tutoriais do Sistema
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Aprenda a usar todas as funcionalidades do Psiclo com nossos vídeos tutoriais
          </p>
        </CardHeader>
        <CardContent>
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {videos.map((video) => (
                <CarouselItem key={video.id}>
                  <div className="space-y-4">
                    <div className="relative overflow-hidden rounded-lg">
                      <iframe
                        width="100%"
                        height="315"
                        src={`https://www.youtube.com/embed/${video.youtubeId}?rel=0&modestbranding=1`}
                        title={video.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full aspect-video"
                        loading="lazy"
                      />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="font-semibold text-lg">{video.title}</h3>
                      <p className="text-sm text-muted-foreground">{video.description}</p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious 
              className="border-2 hover:bg-background" 
              style={{ 
                borderColor: '#002472',
                color: '#002472'
              }}
            />
            <CarouselNext 
              className="border-2 hover:bg-background"
              style={{ 
                borderColor: '#002472',
                color: '#002472'
              }}
            />
          </Carousel>
          
          {/* Indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {videos.map((_, index) => (
              <div
                key={index}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: '#002472', opacity: 0.3 }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TutorialVideoCarousel;
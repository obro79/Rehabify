import { SanctuaryBackground } from "@/components/ui/sanctuary-background";
import { OrganicBlob } from "@/components/ui/organic-blob";
import { GradientMesh } from "@/components/ui/gradient-mesh";

/**
 * Test page for Sanctuary Background components
 * View at: http://localhost:3000/test-sanctuary
 */
export default function TestSanctuaryPage() {
  return (
    <div className="min-h-screen">
      {/* Test 1: Default variant */}
      <section className="relative h-screen border-b-4 border-sage-500">
        <SanctuaryBackground variant="default">
          <div className="flex items-center justify-center h-full">
            <div className="surface-organic p-8 max-w-md">
              <h1 className="text-3xl font-bold text-sage-900 mb-4">
                Default Variant
              </h1>
              <p className="text-muted-foreground">
                Multiple blobs in corners with gradient mesh. Breathing and
                float animations active.
              </p>
            </div>
          </div>
        </SanctuaryBackground>
      </section>

      {/* Test 2: Minimal variant */}
      <section className="relative h-screen border-b-4 border-terracotta-500">
        <SanctuaryBackground variant="minimal">
          <div className="flex items-center justify-center h-full">
            <div className="surface-organic p-8 max-w-md">
              <h1 className="text-3xl font-bold text-sage-900 mb-4">
                Minimal Variant
              </h1>
              <p className="text-muted-foreground">
                Very subtle background for workout session. No decorative
                elements.
              </p>
            </div>
          </div>
        </SanctuaryBackground>
      </section>

      {/* Test 3: Celebration variant */}
      <section className="relative h-screen border-b-4 border-coral-500">
        <SanctuaryBackground variant="celebration">
          <div className="flex items-center justify-center h-full">
            <div className="surface-organic p-8 max-w-md">
              <h1 className="text-3xl font-bold text-sage-900 mb-4">
                Celebration Variant
              </h1>
              <p className="text-muted-foreground">
                More vivid colors and additional blobs for workout complete.
                Enhanced animations.
              </p>
            </div>
          </div>
        </SanctuaryBackground>
      </section>

      {/* Test 4: Individual components */}
      <section className="relative h-screen bg-background">
        <div className="flex items-center justify-center h-full">
          <div className="surface-organic p-8 max-w-2xl">
            <h1 className="text-3xl font-bold text-sage-900 mb-6">
              Individual Components
            </h1>

            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">OrganicBlob</h2>
                <div className="relative h-64 bg-muted rounded-2xl overflow-hidden">
                  <OrganicBlob
                    size={200}
                    color="sage"
                    position={{ top: "10%", left: "10%" }}
                    variant={0}
                    animate={true}
                  />
                  <OrganicBlob
                    size={150}
                    color="terracotta"
                    position={{ bottom: "10%", right: "10%" }}
                    variant={1}
                    animate={true}
                  />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">GradientMesh</h2>
                <div className="relative h-64 bg-white rounded-2xl overflow-hidden border border-border">
                  <GradientMesh variant="mixed" intensity={0.8} position="center" />
                  <div className="relative z-10 flex items-center justify-center h-full">
                    <p className="text-foreground font-medium">
                      Mixed gradient mesh behind this text
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

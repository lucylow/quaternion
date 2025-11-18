import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Brain, Zap, Leaf, Box, GitBranch } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TECH_TREE } from "@/data/quaternionData";

const TechTree = () => {
  const navigate = useNavigate();

  const branchIcons: Record<string, typeof Brain> = {
    'matter': Box,
    'energy': Zap,
    'life': Leaf,
    'knowledge': Brain,
  };

  const branchColors: Record<string, string> = {
    'matter': 'text-blue-400',
    'energy': 'text-yellow-400',
    'life': 'text-green-400',
    'knowledge': 'text-purple-400',
  };

  const branchBorders: Record<string, string> = {
    'matter': 'border-blue-400/30',
    'energy': 'border-yellow-400/30',
    'life': 'border-green-400/30',
    'knowledge': 'border-purple-400/30',
  };

  const technologiesByBranch = {
    matter: Object.values(TECH_TREE).filter(t => t.branch === 'matter'),
    energy: Object.values(TECH_TREE).filter(t => t.branch === 'energy'),
    life: Object.values(TECH_TREE).filter(t => t.branch === 'life'),
    knowledge: Object.values(TECH_TREE).filter(t => t.branch === 'knowledge'),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-primary/30">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-primary hover:text-secondary"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            <a href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
              <GitBranch className="w-8 h-8" />
              <span>QUATERNION<span className="text-secondary">:</span>NF</span>
            </a>
            <div className="w-24" />
          </div>
        </nav>
      </header>

      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6">
              Technology Tree
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Research technologies across four branches to unlock new capabilities and victory conditions
            </p>
          </div>

          {/* Tech Branches */}
          {Object.entries(technologiesByBranch).map(([branch, techs]) => {
            const Icon = branchIcons[branch];
            const color = branchColors[branch];
            const border = branchBorders[branch];

            return (
              <section key={branch} className="mb-16">
                <h2 className={`text-3xl font-bold mb-6 flex items-center gap-3 ${color}`}>
                  <Icon className="w-8 h-8" />
                  {branch.charAt(0).toUpperCase() + branch.slice(1)} Branch
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {techs.map((tech) => (
                    <Card
                      key={tech.id}
                      className={`bg-card/70 ${border} hover:border-primary transition-colors`}
                    >
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-primary mb-3">{tech.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{tech.description}</p>
                        
                        <div className="mb-4">
                          <div className="text-xs font-bold text-primary mb-2">Cost:</div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {tech.cost.matter && (
                              <span className="px-2 py-1 rounded bg-blue-400/20 text-blue-400">
                                Matter: {tech.cost.matter}
                              </span>
                            )}
                            {tech.cost.energy && (
                              <span className="px-2 py-1 rounded bg-yellow-400/20 text-yellow-400">
                                Energy: {tech.cost.energy}
                              </span>
                            )}
                            {tech.cost.life && (
                              <span className="px-2 py-1 rounded bg-green-400/20 text-green-400">
                                Life: {tech.cost.life}
                              </span>
                            )}
                            {tech.cost.knowledge && (
                              <span className="px-2 py-1 rounded bg-purple-400/20 text-purple-400">
                                Knowledge: {tech.cost.knowledge}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="text-xs font-bold text-primary mb-2">Effects:</div>
                          <p className="text-sm text-muted-foreground">{tech.effects}</p>
                        </div>

                        <div className="mb-4">
                          <div className="text-xs font-bold text-primary mb-2">Research Time:</div>
                          <p className="text-sm text-muted-foreground">{tech.researchTime} seconds</p>
                        </div>

                        {tech.prerequisites.length > 0 && (
                          <div>
                            <div className="text-xs font-bold text-primary mb-2">Prerequisites:</div>
                            <div className="flex flex-wrap gap-1">
                              {tech.prerequisites.map((prereq) => (
                                <span
                                  key={prereq}
                                  className="px-2 py-1 rounded bg-primary/20 text-primary text-xs"
                                >
                                  {TECH_TREE[prereq]?.name || prereq}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}

          {/* Victory Conditions */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-6">Terminal Technologies</h2>
            <Card className="bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/50">
              <CardContent className="p-8">
                <p className="text-muted-foreground mb-6">
                  Terminal technologies represent the ultimate achievements in each branch. Researching all terminal
                  technologies unlocks the <strong className="text-primary">Quantum Ascendancy</strong> victory condition.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.values(TECH_TREE)
                    .filter(t => t.id === 'quantum_ascendancy')
                    .map((tech) => (
                      <div key={tech.id} className="p-4 bg-background/50 rounded-lg border border-primary/30">
                        <h3 className="text-xl font-bold text-primary mb-2">{tech.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{tech.description}</p>
                        <div className="text-xs font-bold text-primary mb-2">Effects:</div>
                        <p className="text-sm text-muted-foreground">{tech.effects}</p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Strategy Tips */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-6">Research Strategy</h2>
            <Card className="bg-card/70 border-primary/30">
              <CardContent className="p-8 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-primary mb-2">Plan Your Path</h3>
                  <p className="text-muted-foreground">
                    Technologies have prerequisites. Plan your research path early to avoid wasting resources
                    on technologies you can't use yet.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary mb-2">Balance Your Research</h3>
                  <p className="text-muted-foreground">
                    Don't focus on one branch exclusively. Each branch offers unique advantages, and balance
                    is key to maintaining Quaternion stability.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary mb-2">Early Game Priorities</h3>
                  <p className="text-muted-foreground">
                    Start with basic technologies that improve resource generation. These provide the foundation
                    for advanced research later.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary mb-2">Victory Conditions</h3>
                  <p className="text-muted-foreground">
                    Terminal technologies unlock victory conditions. Research them strategically based on your
                    chosen path to victory.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* CTA */}
          <div className="text-center">
            <Button
              onClick={() => navigate('/game')}
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-neon"
            >
              Start Researching
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechTree;



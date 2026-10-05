import { ServiceItem, ServiceRequest } from '../types';

export const SERVICES_DATA: ServiceItem[] = [
  {
    id: 'pintura',
    name: 'Pintura Residencial & Predial',
    slug: 'pintura',
    category: 'acabamento',
    shortDescription: 'Pintura residencial, comercial, massa corrida, texturas, impermeabilização e pintura epóxi.',
    fullDescription: 'Equipe especializada em pintura interna e externa, tratamento de umidade e fissuras, aplicação de massa acrílica/corrida, textura projetada, verniz, esmalte sintético e impermeabilização com garantia de acabamento fino.',
    iconName: 'Paintbrush',
    accentGradient: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
    badge: 'Acabamento & Estética',
    estimatedTime: '1 a 3 dias',
    basePrice: 'R$ 0,00 (Sob Orçamento)',
    isEmergency24h: false,
    commonServices: [
      'Pintura interna e teto (Látex/Acrílica)',
      'Pintura de fachadas e muros externos',
      'Aplicação de massa corrida e lixamento',
      'Textura grafiato e projetada',
      'Pintura de portas, janelas e grades',
      'Pintura epóxi para pisos industriais e garagens'
    ],
    options: [
      { id: 'int_simples', label: 'Pintura Interna Parede/Teto', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'massa_corrida', label: 'Emassamento completo + Pintura', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'externa_fachada', label: 'Fachada Externa com impermeabilização', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'portas_esquadrias', label: 'Verniz / Esmalte em Portas e Grades', priceEstimate: 'R$ 0,00 (A definir)' },
    ],
    tags: ['Tintas', 'Fachadas', 'Massa Corrida', 'Textura', 'Paredes', 'Impermeabilização']
  },
  {
    id: 'serralheria',
    name: 'Serralheria & Estruturas',
    slug: 'serralheria',
    category: 'estrutural',
    shortDescription: 'Portões metálicos, grades de segurança, corrimãos, estruturas metálicas e soldas.',
    fullDescription: 'Fabricação, reforma e reparos rápidos em ferro, aço carbono e alumínio. Serviços de solda MIG/TIG/Eletrodo no local, conserto de portões basculantes e deslizantes, troca de cabos de aço e travas de segurança.',
    iconName: 'ShieldAlert',
    accentGradient: 'from-zinc-500/20 to-slate-400/20 text-slate-300 border-slate-500/30',
    badge: 'Segurança & Estrutura',
    estimatedTime: '2 a 5 horas ou sob medida',
    basePrice: 'R$ 0,00 (Sob Orçamento)',
    isEmergency24h: true,
    commonServices: [
      'Conserto e solda de portão danificado/travado',
      'Instalação de grades de proteção para janelas',
      'Corrimãos e guarda-corpos em aço',
      'Troca de roldanas e cabos de aço de portões',
      'Reforço estrutural e fechamentos metálicos',
      'Instalação de travas eletromecânicas'
    ],
    options: [
      { id: 'solda_reparo', label: 'Solda no local e reparo de portão', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'grades_seguranca', label: 'Instalação de Grade de Proteção', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'troca_roldanas', label: 'Troca de cabos e roldanas de portão', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'corrimão', label: 'Corrimão e Guarda-corpo', priceEstimate: 'R$ 0,00 (A definir)' }
    ],
    tags: ['Solda', 'Portão', 'Grades', 'Ferro', 'Alumínio', 'Guarda-corpo']
  },
  {
    id: 'pisos',
    name: 'Assentamento de Pisos & Revestimentos',
    slug: 'assentamento-de-pisos',
    category: 'acabamento',
    shortDescription: 'Porcelanato, pisos vinílicos, cerâmicas, laminados, rodapés e rejunte nivelado.',
    fullDescription: 'Instalação com espaçadores niveladores de alta precisão. Remoção de pisos antigos, regularização de contrapiso, corte especial em 45 graus (meia esquadria), instalação de rodapés em poliestireno/madeira e aplicação de rejunte epóxi ou acrílico.',
    iconName: 'Grid',
    accentGradient: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
    badge: 'Alta Precisão',
    estimatedTime: '2 a 5 dias conforme metragem',
    basePrice: 'R$ 0,00 (Sob Orçamento)',
    isEmergency24h: false,
    commonServices: [
      'Assentamento de porcelanato grandes formatos',
      'Piso cerâmico residencial e comercial',
      'Instalação de piso vinílico (colado ou clicado)',
      'Instalação de piso laminado de madeira',
      'Troca de peças soltas ou trincadas',
      'Corte meia-esquadria (45º) em nichos e bancadas'
    ],
    options: [
      { id: 'porcelanato', label: 'Porcelanato e grandes formatos', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'vinilico_laminado', label: 'Piso Vinílico ou Laminado', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'ceramica', label: 'Piso Cerâmico tradicional', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'reparo_peças', label: 'Troca pontual de peças quebradas', priceEstimate: 'R$ 0,00 (A definir)' }
    ],
    tags: ['Porcelanato', 'Vinílico', 'Cerâmica', 'Revestimento', 'Laminado', 'Rejunte']
  },
  {
    id: 'alvenarias',
    name: 'Manutenção Civil & Alvenaria',
    slug: 'servicos-de-alvenarias',
    category: 'estrutural',
    shortDescription: 'Levantamento e demolição de paredes, reboco, emboço, contra-piso e reformas estruturais.',
    fullDescription: 'Pedreiros e mestres de obras qualificados para abertura de vãos para portas/janelas, levantamento de alvenaria convencional e estrutural, regularização de pisos e lajes, fechamento de vãos, reboco e preparação para acabamento.',
    iconName: 'Layers',
    accentGradient: 'from-stone-500/20 to-orange-600/20 text-stone-300 border-stone-500/30',
    badge: 'Construção & Reformas',
    estimatedTime: '1 a 7 dias',
    basePrice: 'R$ 0,00 (Sob Orçamento)',
    isEmergency24h: false,
    commonServices: [
      'Construção de paredes em bloco cerâmico ou concreto',
      'Demolição controlada e remoção de entulho',
      'Reboco, emboço e chapisco de paredes',
      'Execução de contrapiso autonivelante ou farofa',
      'Abertura ou fechamento de vãos de portas e janelas',
      'Construção de muros de divisa e muretas'
    ],
    options: [
      { id: 'parede_nova', label: 'Levantamento de parede + reboco', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'demolicao', label: 'Demolição com descarte incluso', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'contrapiso', label: 'Execução de contrapiso nivelado', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'abertura_vao', label: 'Abertura de vão para porta/janela', priceEstimate: 'R$ 0,00 (A definir)' }
    ],
    tags: ['Pedreiro', 'Paredes', 'Reboco', 'Demolição', 'Contrapiso', 'Blocos']
  },
  {
    id: 'telhados',
    name: 'Manutenção em Telhados & Estruturas Metálicas',
    slug: 'manutencao-em-telhados',
    category: 'manutencao',
    shortDescription: 'Eliminação de goteiras, troca de telhas, estruturas metálicas, galpões, limpeza e vedação de calhas e rufos.',
    fullDescription: 'Prevenção e conserto imediato contra infiltrações pluviais e reformas de galpões/telhados industriais. Troca de telhas metálicas, termoacústicas e cerâmicas, mantas impermeabilizantes, solda estrutural e limpeza de calhas.',
    iconName: 'Home',
    accentGradient: 'from-amber-600/20 to-red-600/20 text-amber-300 border-amber-600/30',
    badge: 'Telhados & Galpões',
    estimatedTime: '2 a 8 horas ou projeto',
    basePrice: 'R$ 0,00 (Sob Orçamento)',
    isEmergency24h: true,
    commonServices: [
      'Localização e eliminação de goteiras e vazamentos',
      'Estruturas metálicas para galpões e coberturas',
      'Troca e reposição de telhas quebradas ou deslocadas',
      'Desobstrução e limpeza de calhas e condutores',
      'Vedação e aplicação de manta asfáltica em rufos',
      'Pintura térmica e impermeabilização de lajes/telhados'
    ],
    options: [
      { id: 'goteira_urgente', label: 'Correção de goteiras e vazamentos urgentes', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'limpeza_calhas', label: 'Limpeza de calhas e condutores pluviais', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'manta_impermeabilizante', label: 'Aplicação de Manta Líquida/Asfáltica', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'revisao_completa', label: 'Revisão geral do telhado / galpão', priceEstimate: 'R$ 0,00 (A definir)' }
    ],
    tags: ['Goteiras', 'Calhas', 'Rufos', 'Telhas', 'Galpões', 'Manta', 'Infiltração']
  },
  {
    id: 'fechaduras',
    name: 'Troca de Fechaduras & Chaveiro',
    slug: 'troca-de-fechaduras',
    category: 'emergencial',
    shortDescription: 'Fechaduras digitais/eletrônicas, tetra, convencionais, travas auxiliares e chaveiro 24h.',
    fullDescription: 'Atendimento rápido para destravamento e abertura de portas trancadas sem danificar a estrutura. Instalação e configuração de fechaduras digitais e biométricas (Intelbras, Yale, Elsys), substituição de cilindros e instalação de travas tetra para segurança máxima.',
    iconName: 'KeyRound',
    accentGradient: 'from-yellow-500/20 to-amber-500/20 text-yellow-400 border-yellow-500/30',
    badge: 'Chaveiro & Segurança 24h',
    estimatedTime: '30 a 60 minutos',
    basePrice: 'R$ 0,00 (Sob Orçamento)',
    isEmergency24h: true,
    commonServices: [
      'Abertura de portas trancadas ou chave quebrada no miolo',
      'Instalação de fechadura digital biométrica ou com senha',
      'Substituição de cilindros e fechaduras convencionais',
      'Instalação de travas auxiliares tipo tetra e bico de papagaio',
      'Regulagem e alinhamento de maçanetas e trincos',
      'Troca de segredo e cópia de chaves'
    ],
    options: [
      { id: 'abertura_emergencial', label: 'Abertura de porta (Socorro 24h)', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'instalacao_digital', label: 'Instalação de Fechadura Digital/Smart', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'troca_cilindro', label: 'Troca de cilindro / Miolo com chaves novas', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'trava_tetra', label: 'Instalação de Trava Tetra de segurança', priceEstimate: 'R$ 0,00 (A definir)' }
    ],
    tags: ['Chaveiro', 'Fechadura Digital', 'Cilindro', 'Porta Trancada', 'Segurança', 'Emergência']
  },
  {
    id: 'ar_condicionado',
    name: 'Refrigeração & Ar-Condicionado Split e Central',
    slug: 'manutencao-e-instalacao-de-ar-condicionado',
    category: 'climatizacao',
    shortDescription: 'Instalação de split/inverter/central, higienização antibacteriana, recarga de gás e conserto de vazamentos.',
    fullDescription: 'Técnicos certificados para instalação e manutenção preventiva e corretiva de todas as marcas (LG, Samsung, Daikin, Midea, Consul, Electrolux, Carrier). Limpeza profunda com bactericida padrão ANVISA, vácuo na tubulação, carga de fluido R410A/R32 e conserto de placas elétricas.',
    iconName: 'Wind',
    accentGradient: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30',
    badge: 'Refrigeração & Climatização',
    estimatedTime: '1 a 3 horas',
    basePrice: 'R$ 0,00 (Sob Orçamento)',
    isEmergency24h: false,
    commonServices: [
      'Instalação completa de Ar Condicionado Split e Central',
      'Higienização profunda com aplicação de bactericida e desodorizador',
      'Recarga e verificação de vazamento de gás refrigerante',
      'Desentupimento e conserto de dreno (pinga-pinga interno)',
      'Substituição de capacitor, ventoinha e sensores',
      'Desinstalação e remanejamento de aparelho'
    ],
    options: [
      { id: 'higienizacao_split', label: 'Higienização Completa Padrão Anvisa', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'instalacao_padrao', label: 'Instalação Completa Split / Central', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'recarga_gas', label: 'Recarga de Gás + Teste de Estanqueidade', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'conserto_dreno', label: 'Conserto de vazamento de água / dreno', priceEstimate: 'R$ 0,00 (A definir)' }
    ],
    tags: ['Split', 'Central', 'Inverter', 'Gás', 'Higienização', 'Climatização', 'Refrigeração']
  },
  {
    id: 'eletrica',
    name: 'Serviços Elétricos & Instalações',
    slug: 'instalacoes-e-manutencao-eletrica',
    category: 'eletrica',
    shortDescription: 'Quadros de distribuição, fiação, disjuntores, chuveiros, iluminação LED, aterramento e laudos elétricos.',
    fullDescription: 'Eletricistas e engenheiros qualificados conforme normas NR-10 e NBR 5410. Diagnóstico de sobrecargas, troca de fiação antiga, instalação de DR e DPS contra queima de aparelhos, substituição de disjuntores, instalação de luminárias, fitas LED, tomadas e cabeamento estruturado.',
    iconName: 'Zap',
    accentGradient: 'from-amber-500/20 to-red-500/20 text-amber-400 border-amber-500/30',
    badge: 'Eletricistas Certificados NR-10',
    estimatedTime: '1 a 4 horas',
    basePrice: 'R$ 0,00 (Sob Orçamento)',
    isEmergency24h: true,
    commonServices: [
      'Reparo de curto-circuito e queda constante de disjuntor',
      'Troca e modernização de Quadro de Distribuição (QDF)',
      'Instalação de Chuveiro Elétrico e Tomadas 20A / 110V-220V',
      'Instalação de Luminárias, Spots, Trilhos e Fitas LED',
      'Instalação de DR (Diferencial Residual) e DPS contra raios',
      'Passagem de fiação nova e balanceamento de fases'
    ],
    options: [
      { id: 'curto_circuito', label: 'Diagnóstico e Reparo de Curto-Circuito (Emergencial)', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'troca_quadro', label: 'Troca de Disjuntor ou Reforma de Quadro Elétrico', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'chuveiro_tomadas', label: 'Instalação de Chuveiro + Revisão de Fiação', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'iluminacao_completa', label: 'Projeto e Instalação de Iluminação LED', priceEstimate: 'R$ 0,00 (A definir)' }
    ],
    tags: ['Eletricista', 'Curto-Circuito', 'Disjuntor', 'Chuveiro', 'Quadro de Luz', 'LED', 'Fiação', 'NR10']
  },
  {
    id: 'pequenos_reparos',
    name: 'Pequenos Reparos Prediais & Jardinagem',
    slug: 'pequenos-reparos-prediais',
    category: 'manutencao',
    shortDescription: 'Manutenção de áreas verdes, jardinagem, suportes de TV, quadros, cortinas, tomadas e reparos gerais.',
    fullDescription: 'Solução completa para seu imóvel ou condomínio: corte de grama, poda de cerca viva, paisagismo, fixação de suportes, prateleiras, espelhos, troca de lâmpadas, portas e reparos gerais rápidos.',
    iconName: 'Wrench',
    accentGradient: 'from-violet-500/20 to-purple-500/20 text-violet-400 border-violet-500/30',
    badge: 'Reparos & Jardinagem',
    estimatedTime: '1 a 3 horas',
    basePrice: 'R$ 0,00 (Sob Orçamento)',
    isEmergency24h: false,
    commonServices: [
      'Manutenção de jardins, corte de grama e poda de cerca viva',
      'Instalação de suporte de TV articulado ou fixo',
      'Fixação de espelhos, quadros, prateleiras e nichos',
      'Instalação de cortinas, persianas e trilhos',
      'Troca de tomadas, interruptores e lâmpadas LED',
      'Instalação de varais de teto e acessórios de banheiro'
    ],
    options: [
      { id: 'jardinagem', label: 'Jardinagem e Manutenção de Áreas Verdes', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'suporte_tv', label: 'Instalação de Suporte de TV + Cabeamento', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'instalacao_luminarias', label: 'Instalação de Luminárias / Pendentes', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'reparos_gerais', label: 'Pacote de Reparos Gerais e Fixações', priceEstimate: 'R$ 0,00 (A definir)' }
    ],
    tags: ['Jardinagem', 'Reparos', 'TV', 'Quadros', 'Luminárias', 'Manutenção']
  },
  {
    id: 'descarte_entulho',
    name: 'Descartes de Entulhos e Caçambas',
    slug: 'descartes-de-entulhos-e-residuos-nao-contaminantes',
    category: 'descarte',
    shortDescription: 'Locação de caçambas estacionárias, coleta de entulho ensacado e restos de obra com destinação ecológica.',
    fullDescription: 'Remoção rápida e legalizada de resíduos da construção civil (classe A e B: tijolos, concreto, cerâmica, gesso, madeira, terra, podas e papelão). Fornecimento de caçambas regulamentadas (3m³ a 7m³), retirada com caminhão próprio e emissão do manifesto de transporte de resíduos (MTR).',
    iconName: 'Trash2',
    accentGradient: 'from-lime-500/20 to-emerald-600/20 text-lime-400 border-lime-500/30',
    badge: 'Descarte Ecológico Certificado',
    estimatedTime: 'Colocação agendada',
    basePrice: 'R$ 0,00 (Sob Orçamento)',
    isEmergency24h: false,
    commonServices: [
      'Locação de caçamba estacionária regulamentada',
      'Retirada de entulho ensacado em locais de difícil acesso',
      'Remoção de sobras de gesso, drywall e madeira',
      'Coleta de resíduos verdes de poda e jardinagem',
      'Limpeza pós-obra pesada com destinação autorizada'
    ],
    options: [
      { id: 'cacamba_padrao', label: 'Caçamba Estacionária', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'entulho_ensacado', label: 'Retirada de Entulho Ensacado', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'coleta_madeira_gesso', label: 'Coleta de restos de Drywall, Gesso e Madeira', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'limpeza_terreno', label: 'Limpeza de lote / quintal com descarte', priceEstimate: 'R$ 0,00 (A definir)' }
    ],
    tags: ['Caçamba', 'Entulho', 'Restos de Obra', 'Gesso', 'Madeira', 'Reciclagem']
  },
  {
    id: 'blindex',
    name: 'Instalação e Manutenção em Blindex',
    slug: 'instalacao-e-manutencao-em-blindex',
    category: 'instalacoes',
    shortDescription: 'Box de banheiro em vidro temperado, portas e janelas de correr, troca de roldanas, molas e puxadores.',
    fullDescription: 'Vidraçaria técnica para manutenção preventiva e corretiva de vidros temperados Blindex. Substituição de roldanas blindadas para portas pesadas, troca de batedores e fitas de vedação, ajuste de molas de piso hidráulicas, conserto de portas de vidro emperradas e novos projetos sob medida.',
    iconName: 'Sparkles',
    accentGradient: 'from-sky-500/20 to-indigo-500/20 text-sky-400 border-sky-500/30',
    badge: 'Vidros Temperados & Box',
    estimatedTime: '1 a 3 horas ou projeto',
    basePrice: 'R$ 0,00 (Sob Orçamento)',
    isEmergency24h: true,
    commonServices: [
      'Troca de roldanas e regulagem de box de banheiro',
      'Manutenção em portas de vidro Blindex que raspam no chão',
      'Instalação de Box de vidro frontal e de canto (8mm)',
      'Substituição de mola hidráulica de piso',
      'Troca de fechaduras de vidro, trincos e puxadores em inox'
    ],
    options: [
      { id: 'manutencao_box', label: 'Manutenção de Box (Roldanas novas + regulagem)', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'ajuste_porta_vidro', label: 'Ajuste de porta de vidro de correr ou pivotante', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'troca_mola_piso', label: 'Troca de Mola Hidráulica de Piso', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'novo_box_blindex', label: 'Instalação de Box Novo Temperado', priceEstimate: 'R$ 0,00 (A definir)' }
    ],
    tags: ['Box Banheiro', 'Vidro Temperado', 'Roldanas', 'Mola de Piso', 'Vidraçaria', 'Segurança']
  },
  {
    id: 'hidraulica',
    name: 'Serviços Hidráulicos & Encanador',
    slug: 'servicos-hidraulicos',
    category: 'emergencial',
    shortDescription: 'Caça-vazamentos, troca de sifões, torneiras, registros, desentupimentos e conserto de descargas.',
    fullDescription: 'Encanadores profissionais disponíveis 24h para emergências hidráulicas. Detecção eletrônica de vazamentos não visíveis, troca de reparos de válvulas Hydra e caixas acopladas, conserto de canos furados (PVC, PPR, Cobre), instalação de pressurizadores e bombas d’água.',
    iconName: 'Droplets',
    accentGradient: 'from-blue-500/20 to-teal-500/20 text-blue-400 border-blue-500/30',
    badge: 'Encanador 24 Horas',
    estimatedTime: '30 min a 2 horas',
    basePrice: 'R$ 0,00 (Sob Orçamento)',
    isEmergency24h: true,
    commonServices: [
      'Conserto urgente de vazamentos e canos furados',
      'Troca de reparo de descarga Hydra e Caixa Acoplada',
      'Instalação e troca de torneiras, misturadores e chuveiros',
      'Desentupimento de pias, ralos, vasos e esgotos',
      'Instalação de bomba pressurizadora de água'
    ],
    options: [
      { id: 'vazamento_urgente', label: 'Atendimento Emergencial a Vazamento de Água', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'troca_reparo_descarga', label: 'Conserto de Descarga (Válvula Hydra ou Caixa)', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'troca_sifao_torneira', label: 'Instalação de Torneira / Chuveiro / Sifão', priceEstimate: 'R$ 0,00 (A definir)' },
      { id: 'desentupimento_ralo', label: 'Desentupimento mecânico de pia ou ralo', priceEstimate: 'R$ 0,00 (A definir)' }
    ],
    tags: ['Encanador', 'Vazamento', 'Descarga', 'Torneira', 'Chuveiro', 'Desentupimento', 'Emergência']
  }
];

export const RM_CONTACT_INFO = {
  companyName: 'RM Manutec',
  tagline: 'Civil • Elétrica • Ar-Condicionado',
  slogan: 'Qualidade, Segurança e Atendimento Especializado!',
  cnpj: '64.177.147/0001-34',
  cnpjFormatted: 'CNPJ: 64.177.147/0001-34',
  phone: '(71) 99649-2354',
  phoneSecondary: '(71) 99649-2354',
  phoneMobile: '(71) 99649-2354',
  whatsapp: '5571996492354',
  whatsappDisplay: '(71) 99649-2354',
  email: 'rm.manutec.01@gmail.com',
  emailCorporate: 'rm.manutec.01@gmail.com',
  emails: ['rm.manutec.01@gmail.com'],
  address: 'Rua da Paz, Itapuã, Salvador - BA',
  hours24h: 'Atendimento Emergencial 24 Horas / 7 Dias',
  businessHours: 'Segunda a Sábado: 07:00 às 20:00 (Comercial) | Plantão 24h'
};

export const RM_BANKING_DETAILS = {
  bankName: 'Banco do Brasil S.A. (001)',
  agency: '3458-9',
  accountNumber: '48.910-4',
  accountType: 'Conta Corrente Pessoa Jurídica',
  pixKeyCnpj: '64.177.147/0001-34',
  pixKeyPhone: '+5571996492354',
  pixKeyEmail: 'rm.manutec.01@gmail.com',
  beneficiaryName: 'RM MANUTEC SERVIÇOS E MANUTENÇÃO LTDA',
  cnpj: '64.177.147/0001-34',
  city: 'Salvador - BA'
};

export const MERCADO_PAGO_CONFIG = {
  publicKey: (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_MERCADO_PAGO_PUBLIC_KEY) || 'APP_USR-16842ebb-87c6-4f75-bf11-ac7135790128',
  merchantName: 'RM Manutec Serviços',
  collectorId: '8189215440985758',
  gatewayName: 'Mercado Pago Brasil',
  supportedPaymentMethods: ['pix', 'credit_card', 'debit_card', 'bolbradesco', 'pec'],
  isProductionReady: true
};

export const PAYMENT_METHODS_OPTIONS = [
  {
    id: 'pix' as const,
    name: 'PIX Instantâneo',
    badge: '5% OFF à Vista',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description: 'Aprovação imediata 24h via QR Code ou Chave CNPJ com desconto especial.',
    popular: true
  },
  {
    id: 'cartao_credito' as const,
    name: 'Cartão de Crédito',
    badge: 'Até 12x Sem Juros',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    description: 'Parcele em até 12x sem juros (Visa, Mastercard, Elo, Hipercard, Amex).',
    popular: true
  },
  {
    id: 'cartao_debito' as const,
    name: 'Cartão de Débito',
    badge: 'À Vista',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    description: 'Pagamento à vista seguro com cartão de débito de qualquer instituição.',
    popular: false
  },
  {
    id: 'boleto' as const,
    name: 'Boleto Bancário',
    badge: 'Vencimento 3 Dias',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description: 'Boleto registrado gerado na hora para pagamento em bancos, lotéricas ou internet banking.',
    popular: false
  },
  {
    id: 'faturamento_pj' as const,
    name: 'Faturamento PJ (15/30 Dias)',
    badge: 'Para Empresas & Condomínios',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    description: 'Boleto faturado para 15 ou 30 dias com emissão de Nota Fiscal Eletrônica (NF-e).',
    popular: false
  },
  {
    id: 'local_conclusao' as const,
    name: 'Pagar no Local com Técnico',
    badge: 'Após Conclusão',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    description: 'Pague diretamente ao técnico credenciado após o término (Maquininha sem fio, PIX ou Dinheiro).',
    popular: true
  },
  {
    id: 'transferencia' as const,
    name: 'Transferência / TED PJ',
    badge: 'Conta Jurídica',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    description: 'Depósito identificado ou TED direto na conta jurídica da RM Manutec no Banco do Brasil.',
    popular: false
  }
];

export const PRELOADED_USERS = {
  cliente: {
    id: 'usr-cli-1',
    name: 'Mariana Silva Costa',
    email: 'mariana.silva@email.com',
    phone: '(71) 98765-4321',
    role: 'cliente' as const,
    clientType: 'pessoa_fisica' as const,
    password: 'senha@cliente123',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    document: '849.201.734-19',
    cpf: '849.201.734-19',
    rg: '14.892.301-44 - SSP/BA',
    address: 'Rua das Acácias, 250, Pituba, Salvador - BA',
    isVerified: true,
    verificationStatus: 'aprovado' as const,
    activeOrdersCount: 2
  },
  empresa: {
    id: 'usr-empresa-parque-passaros',
    name: 'Condomínio Residencial Parque dos Pássaros',
    email: 'gestao@condominiopassaros.com.br',
    phone: '(71) 98888-7766',
    role: 'cliente' as const,
    clientType: 'empresa_cnpj' as const,
    companyName: 'CONDOMINIO DO EDIFICIO RESIDENCIAL PARQUE DOS PASSAROS',
    tradeName: 'Condomínio Parque dos Pássaros',
    cnpj: '12.345.678/0001-90',
    stateRegistration: 'Isento',
    municipalRegistration: '987.654/001-22',
    companySegment: 'Condomínio Residencial & Comercial',
    legalRepresentativeName: 'Carlos Eduardo Barreto Menezes',
    legalRepresentativeCpf: '321.654.987-00',
    legalRepresentativeRole: 'Síndico Profissional',
    companyPhone: '(71) 98888-7766',
    companyEmail: 'administracao@condominiopassaros.com.br',
    address: 'Av. Paralela, 1500 - Imbuí, Salvador - BA, CEP: 41720-000',
    avatar: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80',
    selfiePhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    contractSocialOrCnpjDocUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    password: 'senha@empresa123',
    document: '12.345.678/0001-90',
    documentType: 'cnpj' as const,
    isVerified: true,
    verificationStatus: 'aprovado' as const,
    activeOrdersCount: 5
  },
  tecnico: {
    id: 'usr-tec-1',
    name: 'Lucas Gabriel Almeida',
    email: 'lucas.almeida@rmmanutec.com.br',
    phone: '(71) 99123-4567',
    role: 'tecnico' as const,
    password: 'senha@tecnico123',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    specialty: 'Especialista em Refrigeração, Elétrica & Civil',
    document: 'CREA-BA 506.892/D',
    documentType: 'crea' as const,
    crea: 'CREA-BA 506.892/D',
    crt: 'CRT-02 0184920/BA',
    cpf: '712.983.456-82',
    rg: '09.114.832-60 - SSP/BA',
    isVerified: true,
    verificationStatus: 'aprovado' as const,
    rating: 4.9,
    activeOrdersCount: 3
  },
  admin: {
    id: 'usr-adm-1',
    name: 'Central Operacional RM Manutec',
    email: 'rm.manutec.01@gmail.com',
    phone: '(71) 99649-2354',
    role: 'admin' as const,
    password: 'TheoMicaelRoselito',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    specialty: 'Gestão Operacional & Despacho Central',
    document: 'CNPJ 64.177.147/0001-34',
    cpf: '64.177.147/0001-34',
    isVerified: true,
    verificationStatus: 'aprovado' as const
  }
};

export const ADMIN_AUTH_CONFIG = {
  authorizedWhatsApp: '71996492354',
  authorizedWhatsAppFormatted: '(71) 99649-2354',
  requires2FA: true
};

export const INITIAL_MOCK_REQUESTS: ServiceRequest[] = [];

export const SALVADOR_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Pituba': { lat: -12.9998, lng: -38.4612 },
  'Caminho das Árvores': { lat: -12.9814, lng: -38.4552 },
  'Itaigara': { lat: -12.9910, lng: -38.4680 },
  'Itapuã': { lat: -12.9463, lng: -38.3582 },
  'Barra': { lat: -13.0084, lng: -38.5303 },
  'Rio Vermelho': { lat: -13.0112, lng: -38.4892 },
  'Brotas': { lat: -12.9867, lng: -38.4878 },
  'Imbuí': { lat: -12.9734, lng: -38.4312 },
  'Costa Azul': { lat: -12.9890, lng: -38.4420 },
  'Armação': { lat: -12.9820, lng: -38.4350 },
  'Cabula': { lat: -12.9560, lng: -38.4680 },
  'Lauro de Freitas': { lat: -12.8983, lng: -38.3241 },
  'Base RM Manutec': { lat: -12.9463, lng: -38.3582 }
};

export function generateSecurityCode(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `RM-${digits}`;
}

export function getCoordinatesByNeighborhood(neighborhood?: string): { lat: number; lng: number } {
  if (!neighborhood) return { lat: -12.9998, lng: -38.4612 };
  for (const [key, coords] of Object.entries(SALVADOR_COORDINATES)) {
    if (neighborhood.toLowerCase().includes(key.toLowerCase())) {
      return coords;
    }
  }
  return { lat: -12.9998, lng: -38.4612 };
}

export function createDefaultGpsTracking(neighborhood?: string) {
  const dest = getCoordinatesByNeighborhood(neighborhood);
  const base = SALVADOR_COORDINATES['Base RM Manutec'];
  
  // Create interpolated route points
  const points = [
    base,
    { lat: base.lat + (dest.lat - base.lat) * 0.25 + 0.001, lng: base.lng + (dest.lng - base.lng) * 0.25 },
    { lat: base.lat + (dest.lat - base.lat) * 0.50 - 0.001, lng: base.lng + (dest.lng - base.lng) * 0.50 },
    { lat: base.lat + (dest.lat - base.lat) * 0.75 + 0.0005, lng: base.lng + (dest.lng - base.lng) * 0.75 },
    dest
  ];

  return {
    lat: points[1].lat,
    lng: points[1].lng,
    heading: 195,
    speed: 36,
    lastUpdated: 'Agora mesmo (GPS Ativo)',
    isTrackingActive: true,
    destinationLat: dest.lat,
    destinationLng: dest.lng,
    etaMinutes: 14,
    distanceKm: 2.8,
    statusDescription: 'Técnico autorizado em trânsito com GPS em tempo real ativado.',
    vehicleType: 'moto' as const,
    routePolyline: points
  };
}

export const INITIAL_INTERACTION_THREADS: import('../types').AdminClientInteractionThread[] = [];


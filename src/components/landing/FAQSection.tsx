
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Como funciona o período de teste gratuito?",
      answer: "Você tem 14 dias para testar todas as funcionalidades sem limitações. Não é necessário cartão de crédito para começar."
    },
    {
      question: "Posso cancelar minha assinatura a qualquer momento?",
      answer: "Sim, você pode cancelar sua assinatura a qualquer momento através das configurações da sua conta. Não há multas ou taxas de cancelamento."
    },
    {
      question: "O sistema integra com outros softwares?",
      answer: "Sim, temos integrações com WhatsApp Business, bancos digitais e sistemas de pagamento. Também oferecemos API para integrações personalizadas."
    },
    {
      question: "Os dados dos pacientes ficam seguros?",
      answer: "Absolutamente. Utilizamos criptografia de ponta a ponta e seguimos todas as normas de segurança e privacidade, incluindo LGPD e regulamentações do CFP."
    },
    {
      question: "Como funciona o suporte técnico?",
      answer: "Oferecemos suporte por email, chat e WhatsApp. Usuários dos planos pagos têm suporte prioritário com tempo de resposta reduzido."
    },
    {
      question: "Posso migrar meus dados de outras planilhas?",
      answer: "Sim, nossa equipe te ajuda a migrar todos os seus dados de planilhas ou outros sistemas gratuitamente durante o período de teste."
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Tire suas dúvidas sobre o Psiclo e como ele pode transformar sua prática.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-200 last:border-b-0">
              <button
                className="w-full py-6 text-left flex items-center justify-between hover:text-psiclo-primary transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="text-lg font-semibold pr-4">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-psiclo-primary" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
              {openIndex === index && (
                <div className="pb-6 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

import { Utensils, Zap, ScanLine, Package } from 'lucide-react'
import { TastyStar, Button } from './ui'
export function Guide({ onDone }: { onDone: () => void }) {
  return (
    <div className="guide">
      <TastyStar />
      <span className="eyebrow">GUIA TASTY</span>
      <h2>Como funciona</h2>
      <p>Um mundo de sabores, do seu jeito.</p>
      <div className="guide-features">
        {[
          {
            icon: Utensils,
            title: 'Avaliação detalhada',
            text: 'Fotografe seu prato, dê uma nota para a comida, o serviço e o ambiente. Compartilhe o que vale a pena provar.',
            color: 'brand-red',
          },
          {
            icon: Zap,
            title: 'Check-in rápido',
            text: 'Registre sua visita com uma nota. Perfeito para aquele lugar que você já conhece bem.',
            color: 'yellow',
          },
          {
            icon: ScanLine,
            title: 'Conta Justa',
            text: 'Leia a foto da conta e divida com seus amigos. Cada pessoa paga apenas o que consumiu.',
            color: 'white',
          },
          {
            icon: Package,
            title: 'Avaliação delivery',
            text: 'Avalie o prato que chegou até você, a embalagem e a entrega. Sua experiência ajuda outras pessoas.',
            color: 'pink',
          },
        ].map(({ icon: Icon, title, text, color }, i) => (
          <div className="guide-feature" key={title}>
            <span className={`feature-icon ${color}`}>
              <Icon />
            </span>
            <div>
              <span className="eyebrow">RECURSO 0{i + 1}</span>
              <article>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            </div>
          </div>
        ))}
      </div>
      <Button onClick={onDone}>Entendi!</Button>
    </div>
  )
}

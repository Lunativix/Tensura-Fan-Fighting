import Phaser from 'phaser'
import { audio } from '../audio/AudioManager.ts'
import { SceneKeys } from '../game/SceneKeys.ts'
import { saveManager } from '../save/SaveManager.ts'
import { drawMenuBackdrop } from '../ui/Backdrop.ts'
import { VerticalMenu } from '../ui/VerticalMenu.ts'
import { downloadJson, openDomForm } from '../ui/DomForm.ts'
import { FONT, FONT_UI, UI } from '../ui/theme.ts'
import { AccountKind } from '../account/types.ts'
import {
  acceptPrivacy,
  authErrorFr,
  changePassword,
  exportAccount,
  isDeviceSessionOpen,
  logoutLocal,
  registerOnGuest,
  unlockLocalSession,
  verifyLogin,
} from '../account/index.ts'

export class AccountScene extends Phaser.Scene {
  private menu!: VerticalMenu
  private status!: Phaser.GameObjects.Text
  private closeForm: (() => void) | null = null
  private formOpen = false
  private backScene: string = SceneKeys.Settings

  constructor() {
    super(SceneKeys.Account)
  }

  init(data?: { from?: string }): void {
    this.backScene = data?.from === 'hub' ? SceneKeys.Hub : SceneKeys.Settings
  }

  create(): void {
    drawMenuBackdrop(this)
    const data = saveManager.load()
    const locked = !isDeviceSessionOpen(data.account)
    const kind = data.account.kind === AccountKind.REGISTERED ? 'Compte' : 'Invité'
    this.add.text(960, 70, 'COMPTE', {
      fontFamily: FONT, fontSize: '42px', color: UI.gold,
    }).setOrigin(0.5)
    this.add.text(960, 118, `${kind}  •  ${data.account.displayName}`, {
      fontFamily: FONT_UI, fontSize: '22px', color: UI.paper,
    }).setOrigin(0.5)
    this.status = this.add.text(960, 168, locked
      ? 'Session verrouillée. Connecte-toi pour gérer le compte.'
      : `Crédits ${data.inventory.credits}   Premium ${data.inventory.premium} (serveur requis)   Collection ${data.collection.cosmetics.length} cosm.`, {
      fontFamily: FONT_UI, fontSize: '18px', color: UI.muted, align: 'center', wordWrap: { width: 1400 },
    }).setOrigin(0.5)
    this.add.text(960, 230, 'Joue d’abord en invité. L’inscription reprend la même progression, la collection et l’inventaire.\nHistoire et collection sont séparées : recommencer l’histoire ne vide pas tes personnages ni tes achats.\nLes achats réels et la monnaie premium sont refusés tant qu’un serveur n’existe pas.\nGoogle / Discord / Steam : plus tard. Mot de passe jamais stocké en clair (PBKDF2).', {
      fontFamily: FONT_UI, fontSize: '16px', color: '#b8cce0', align: 'center', wordWrap: { width: 1500 },
    }).setOrigin(0.5, 0)

    const items = locked
      ? [
        { label: 'CONNEXION', run: () => this.openLogin() },
        { label: 'RETOUR', run: () => this.back() },
      ]
      : data.account.kind === AccountKind.GUEST
        ? [
          { label: 'CREER UN COMPTE', run: () => this.openRegister() },
          { label: 'ACCEPTER LA CONFIDENTIALITE', run: () => this.acceptPrivacy() },
          { label: 'EXPORTER MES DONNEES', run: () => this.exportData() },
          { label: 'SUPPRIMER LES DONNEES LOCALES', run: () => this.deleteLocal() },
          { label: 'RETOUR', run: () => this.back() },
        ]
        : [
          { label: 'CHANGER LE MOT DE PASSE', run: () => this.openPassword() },
          { label: 'DECONNEXION', run: () => this.logout() },
          { label: 'EXPORTER MES DONNEES', run: () => this.exportData() },
          { label: 'SUPPRIMER LE COMPTE LOCAL', run: () => this.deleteLocal() },
          { label: 'RETOUR', run: () => this.back() },
        ]
    this.menu = new VerticalMenu(this, 430, items, 78)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.closeForm?.())
  }

  update(): void {
    if (this.formOpen) {
      return
    }
    this.menu.update()
    if (this.menu.justBack) {
      this.back()
    }
  }

  private host(): HTMLElement {
    return (this.game.canvas.parentElement ?? document.getElementById('game-root')) as HTMLElement
  }

  private openRegister(): void {
    this.formOpen = true
    this.closeForm = openDomForm(this.host(), {
      title: 'Créer un compte',
      hint: 'Ton invité devient ce compte. Même ID, même collection, même inventaire.',
      fields: [
        { name: 'displayName', label: 'Pseudo', type: 'text', placeholder: 'Rimuru' },
        { name: 'email', label: 'E-mail', type: 'email', placeholder: 'toi@exemple.com' },
        { name: 'password', label: 'Mot de passe (8+)', type: 'password' },
        { name: 'privacy', label: 'J’accepte la politique de confidentialité (données locales, suppression, export).', type: 'checkbox' },
      ],
      submitLabel: 'Créer',
      onSubmit: async (values) => {
        const data = saveManager.load()
        const result = await registerOnGuest(data.account, data.gdpr, {
          displayName: String(values.displayName ?? ''),
          email: String(values.email ?? ''),
          password: String(values.password ?? ''),
          privacyAccepted: values.privacy === true,
        })
        if (!result.ok) {
          throw new Error(authErrorFr(result.reason))
        }
        data.account = result.account
        data.gdpr = result.gdpr
        unlockLocalSession()
        saveManager.save(data)
        this.closeOverlay()
        this.scene.restart()
      },
      onCancel: () => this.closeOverlay(),
    })
  }

  private openLogin(): void {
    this.formOpen = true
    this.closeForm = openDomForm(this.host(), {
      title: 'Connexion',
      hint: 'Compte local à cet appareil. Pas de récupération e-mail tant qu’il n’y a pas de serveur.',
      fields: [
        { name: 'email', label: 'E-mail', type: 'email' },
        { name: 'password', label: 'Mot de passe', type: 'password' },
      ],
      submitLabel: 'Entrer',
      onSubmit: async (values) => {
        const data = saveManager.load()
        const ok = await verifyLogin(data.account, String(values.email ?? ''), String(values.password ?? ''))
        if (!ok) {
          throw new Error('E-mail ou mot de passe incorrect.')
        }
        unlockLocalSession()
        saveManager.save(data)
        this.closeOverlay()
        this.scene.restart()
      },
      onCancel: () => this.closeOverlay(),
    })
  }

  private openPassword(): void {
    this.formOpen = true
    this.closeForm = openDomForm(this.host(), {
      title: 'Changer le mot de passe',
      fields: [
        { name: 'current', label: 'Mot de passe actuel', type: 'password' },
        { name: 'next', label: 'Nouveau mot de passe (8+)', type: 'password' },
      ],
      submitLabel: 'Enregistrer',
      onSubmit: async (values) => {
        const data = saveManager.load()
        const result = await changePassword(data.account, String(values.current ?? ''), String(values.next ?? ''))
        if (!result.ok) {
          throw new Error(authErrorFr(result.reason))
        }
        data.account = result.account
        saveManager.save(data)
        this.closeOverlay()
        this.status.setText('Mot de passe mis à jour.')
      },
      onCancel: () => this.closeOverlay(),
    })
  }

  private acceptPrivacy(): void {
    const data = saveManager.load()
    data.gdpr = acceptPrivacy(data.gdpr)
    saveManager.save(data)
    this.status.setText('Confidentialité acceptée. Les données restent sur cet appareil.')
  }

  private exportData(): void {
    const data = saveManager.load()
    const exported = exportAccount(data)
    data.gdpr = exported.gdpr
    saveManager.save(data)
    downloadJson(`tensura-compte-${data.account.id}.json`, exported)
    this.status.setText('Export téléchargé (sans mot de passe ni hash).')
  }

  private deleteLocal(): void {
    const ok = window.confirm('Supprimer le compte et toutes les données locales de cet appareil ?')
    if (!ok) {
      return
    }
    const again = window.confirm('Dernière confirmation : progression, collection et inventaire seront effacés ici.')
    if (!again) {
      return
    }
    saveManager.wipeLocal()
    unlockLocalSession()
    audio.playSfx('back')
    this.scene.start(SceneKeys.Hub)
  }

  private logout(): void {
    logoutLocal()
    this.scene.restart()
  }

  private closeOverlay(): void {
    this.closeForm?.()
    this.closeForm = null
    this.time.delayedCall(120, () => {
      this.formOpen = false
    })
  }

  private back(): void {
    if (this.formOpen) {
      return
    }
    audio.playSfx('back')
    this.scene.start(this.backScene)
  }
}

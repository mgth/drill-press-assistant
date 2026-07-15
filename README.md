# Drill Press Assistant

*[English](#english) · [Français](#français)*

Computes the spindle speeds of a drill press from its belt/pulley transmission
(stepped cones), and recommends the best belt position for a given drill
diameter and material, with a scaled diagram. Runs on **Android, Windows and
Linux**. Bilingual UI (French / English) with metric and imperial units.

---

## English

- **Machine tab** — describe your transmission: motor speed (rpm), 2 or 3 shafts
  (intermediate pulley with a single or double cone), the diameter of each step,
  and the possible belt positions. Several machines can be saved. A mirror option
  lays the diagram out spindle-on-the-left to match the machine in front of you.
- **Drilling tab** — pick a material (steel, stainless, cast iron, aluminium,
  brass, wood, plastic), a bit type (HSS / carbide) and a diameter. The app
  computes the ideal speed (`n = Vc × 1000 / (π × D)`) and recommends the closest
  combination, penalising over-speed twice as much as under-speed (exceeding the
  cutting speed wears an HSS bit; running slower only wastes time). Every speed is
  listed with its deviation and the diameter range it suits, plus a mini belt
  diagram per row.
- **Units** — switch between metric (mm, m/min) and imperial (inches with
  fractional drills, SFM). Values are always stored in metric; only display and
  input convert.

Stack: [Tauri 2](https://v2.tauri.app) + Svelte 5 + TypeScript. The calculation
logic lives in `src/lib/domain/` (pure TypeScript, tested with vitest); the Rust
side is a thin shell. Machines are persisted via `tauri-plugin-store`.

### Development

```bash
npm install
npm run test        # unit tests of the calc engine (vitest)
npm run check       # svelte-check
npm run tauri dev   # desktop app (Windows / Linux)
npm run dev         # UI only in a browser (localStorage persistence)
```

Linux prerequisites: `webkit2gtk-4.1`, `libayatana-appindicator`, `librsvg`
(see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)).

### Desktop build

```bash
npm run tauri build   # binary + packages in src-tauri/target/release/
```

### Android

One-time prerequisites:

1. Android Studio or command-line tools: SDK Platform 34+, Build-Tools,
   Platform-Tools, **NDK** (side-by-side) and CMake.
2. JDK 17 (the one bundled with Android Studio works).
3. Rust targets:
   ```bash
   rustup target add aarch64-linux-android armv7-linux-androideabi \
     i686-linux-android x86_64-linux-android
   ```
4. Environment variables: `JAVA_HOME`, `ANDROID_HOME`,
   `NDK_HOME=$ANDROID_HOME/ndk/<version>`.

Then:

```bash
npm run tauri android init             # generates src-tauri/gen/android (commit it)
npm run tauri android dev              # emulator or USB device (adb)
npm run tauri android build -- --apk   # APK under src-tauri/gen/android/…
```

For a signed release APK, see the
[Tauri Android signing guide](https://v2.tauri.app/distribute/sign/android/).

---

## Français

Calcule les vitesses de broche d'une perceuse à colonne à partir de sa
transmission par courroies (poulies étagées), et recommande la position optimale
des courroies pour un diamètre de perçage et un matériau donnés, avec un schéma à
l'échelle. Fonctionne sous **Android, Windows et Linux**. Interface bilingue
(français / anglais), unités métriques et impériales.

- **Onglet Machine** — décrivez votre transmission : vitesse moteur (tr/min),
  2 ou 3 arbres (poulie intermédiaire à simple ou double cône), diamètres de
  chaque étage, positions de courroie possibles. Plusieurs machines peuvent être
  sauvegardées. Une option miroir dispose le schéma broche-à-gauche pour coller à
  la machine que vous avez devant vous.
- **Onglet Perçage** — choisissez un matériau (acier, inox, fonte, alu, laiton,
  bois, plastique), un type de foret (HSS / carbure) et un diamètre : l'appli
  calcule la vitesse idéale (`n = Vc × 1000 / (π × D)`) et recommande la
  combinaison la plus proche, en pénalisant le dépassement deux fois plus que le
  sous-régime (dépasser la vitesse de coupe use un foret HSS ; tourner moins vite
  ne fait que ralentir). Toutes les vitesses sont listées avec leur écart et la
  plage de diamètres qu'elles couvrent, plus un mini-schéma de courroies par
  ligne.
- **Unités** — bascule entre métrique (mm, m/min) et impérial (pouces avec forets
  fractionnaires, SFM). Les valeurs sont toujours stockées en métrique ; seuls
  l'affichage et la saisie convertissent.

Stack : [Tauri 2](https://v2.tauri.app) + Svelte 5 + TypeScript. La logique de
calcul vit dans `src/lib/domain/` (TypeScript pur, testé avec vitest) ; le côté
Rust est une coquille minimale. Les machines sont persistées via
`tauri-plugin-store`.

### Développement

```bash
npm install
npm run test        # tests unitaires du moteur de calcul (vitest)
npm run check       # svelte-check
npm run tauri dev   # appli desktop (Windows / Linux)
npm run dev         # UI seule dans un navigateur (persistance localStorage)
```

Prérequis Linux : `webkit2gtk-4.1`, `libayatana-appindicator`, `librsvg`
(voir [prérequis Tauri](https://v2.tauri.app/start/prerequisites/)).

### Build desktop

```bash
npm run tauri build   # binaire + paquets dans src-tauri/target/release/
```

### Android

Prérequis (une seule fois) :

1. Android Studio ou command-line tools : SDK Platform 34+, Build-Tools,
   Platform-Tools, **NDK** (side-by-side) et CMake.
2. JDK 17 (celui d'Android Studio convient).
3. Cibles Rust :
   ```bash
   rustup target add aarch64-linux-android armv7-linux-androideabi \
     i686-linux-android x86_64-linux-android
   ```
4. Variables d'environnement : `JAVA_HOME`, `ANDROID_HOME`,
   `NDK_HOME=$ANDROID_HOME/ndk/<version>`.

Puis :

```bash
npm run tauri android init             # génère src-tauri/gen/android (à commiter)
npm run tauri android dev              # émulateur ou appareil USB (adb)
npm run tauri android build -- --apk   # APK dans src-tauri/gen/android/…
```

Pour un APK de release signé, voir la
[documentation Tauri sur la signature Android](https://v2.tauri.app/distribute/sign/android/).

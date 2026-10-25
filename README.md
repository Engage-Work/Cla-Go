# SANDSTORM

A tactical shooter for the web: realistic gunplay plus burst sliding. Pure static files, nothing to install, no internet connection needed, and LAN multiplayer included.

> **Play online**: <https://engage-work.github.io/Cla-Go/>. Click and play, no download.

![Main menu](docs/menu.jpg)

| A site | Mid fight |
| --- | --- |
| ![A site](docs/gameplay-a-site.jpg) | ![Mid](docs/gameplay-mid.jpg) |

*Screenshots show the original Chinese interface.*

## Getting started

Double-click `index.html` (latest Edge / Chrome recommended) and click "Play".
The mouse is locked and the game goes fullscreen on click. Press `Esc` to pause (hold `Esc` to leave fullscreen).

> Fullscreen is needed for the browser's "keyboard lock": only in fullscreen can a page capture browser shortcuts such as `Ctrl+W` and `Ctrl+D`.
> Without it, `Ctrl` to crouch plus a movement key can trigger a browser shortcut and steal pointer lock (it looks like pressing Esc: the pause menu pops up).
> If you do not want fullscreen, turn off "Fullscreen + keyboard lock" under Settings → Mouse & Movement and crouch with `C` instead.

## LAN multiplayer

Play with a roommate or classmates on the same WiFi (versus each other, or on the same team against bots):

1. On one computer, install [Node.js](https://nodejs.org/en) (the LTS version is fine) and double-click **`start-lan-server.cmd`**. On macOS / Linux, run `node server/server.js` instead.
   On first run Windows asks for administrator approval to open the port in the firewall; click "Yes". The window shows the multiplayer address, for example `http://192.168.1.5:8080`.
2. Everyone opens that address in a browser (the computer running the server can also use `http://localhost:8080`).
3. One player clicks "Multiplayer" → "Host Room" to become the host; the others click "Multiplayer" → "Join Room".
4. In the lobby, pick your side (the same side means co-op against bots). The host chooses the mode and clicks "Start Match". Empty slots on each team are filled with bots.

- Team Deathmatch and Demolition are supported. The host's computer simulates the whole match (bots, damage, economy, C4); everyone else only needs a browser.
- Your own movement is computed locally, so it never feels laggy. Shots are judged by the host against what you saw on your screen (lag compensation).
- If you drop out or quit mid-match, go back to the lobby and click "Join Match in Progress" to return. The match keeps running if the host switches windows.
- If you cannot connect, check in order: are both computers on the same WiFi, is the server window still open, and does a campus / hotel WiFi block device-to-device traffic (AP isolation)? A phone hotspot works around that.
- If the port is taken, pick another one: `node server/server.js 8090 --firewall`.
- The online demo page (HTTPS) cannot do multiplayer, because browsers do not let HTTPS pages connect to a LAN server.

## Modes

| Mode | Description |
| --- | --- |
| Demolition | 5v5 rounds with an economy. Attackers plant the C4, Defenders defuse it. First to 9 wins; sides switch after round 8 |
| Team Deathmatch | Instant respawn, free weapon swaps for 20 seconds after spawning, first to 50 kills |
| Firing Range | Unlimited ammo, moving targets, live speed / spread / recoil index readout on the right |

Bot skill: Recruit / Veteran / Elite / Cosmic (reaction time, tracking, recoil control, headshot rate and sliding frequency all rise step by step).
Bots slide while traveling, rotating, retaking sites and when they meet an enemy.

Telling sides apart: Defenders wear dark blue-grey uniforms with a black vest and helmet and a blue armband; Attackers wear sand-colored clothes with a brown chest rig and a dark red headscarf over the face, and an orange armband.
Teammates get a side-colored marker and name overhead; when your crosshair is on a visible enemy, a red "Enemy Name" appears below it.

## Controls

| Key | Action |
| --- | --- |
| W A S D | Move |
| Shift | Walk quietly (can be switched to sprint in Settings, in which case Alt walks) |
| Ctrl / C | Crouch; **pressing it at near-full running speed = slide**, and jumping out of a slide keeps your momentum |
| Space | Jump |
| Left / right click | Fire / scope (snipers), heavy knife attack, underhand grenade throw |
| R / F | Reload / inspect (the butterfly knife has full close, finger-roll and flip-open inspect animations) |
| 1-5, Q, mouse wheel | Primary / secondary / knife / grenades / C4; Q quick-swaps |
| E | Pick up weapons, plant (or hold left click) / defuse C4 |
| G | Drop the current weapon |
| B / Tab | Buy menu / scoreboard |

## Handling parameters

- 128 tick fixed-step physics with a classic FPS movement model: acceleration 5.5, friction 5.2, air acceleration 12, gravity 800 u/s²
- M4A4 run speed 225 u/s, walk 117 u/s, crouch-walk 77 u/s; counter-strafing reaches "accurate speed" in about 70 ms
- Jump height 57 u, crouch-jump onto a 64 u crate; a landing stamina penalty limits bunny hopping
- Sensitivity uses the classic FPS yaw scale (0.022° per unit) and supports raw mouse input
- Spread = base + movement + air + landing + accumulated fire; AK / M4 follow a fixed recoil pattern that recovers after you stop shooting
- Headshot ×4, chest ×1, stomach ×1.25, legs ×0.75; armor / helmet damage reduction; distance falloff; wooden doors, crates, thin walls and sheet metal can be penetrated
- The head hitbox is an ellipsoid fitted to the head model (the helmet counts as head); the air above the head and the neck do not count as headshots

## Melee weapon

Under Settings → Mouse & Movement → "Melee weapon" choose the butterfly knife (default) or the plain knife; it takes effect on your next spawn.
The butterfly knife is a blade and two skeletonized handles, each rotating around its own pivot pin: it flips open when drawn, and `F` inspects it.

## Death cam

After you die, the camera pulls from your eye position to above and behind your body, and you can orbit freely with the mouse; it does not auto-lock onto the killer.
In Demolition, after 2.5 seconds it switches to spectating teammates (left / right click to cycle).

## Changelog

- **v1.2.0**: Added LAN multiplayer (host-authoritative with local movement prediction and lag compensation), a zero-dependency Node multiplayer server, and a lobby with side / mode selection and mid-match joining
- **v1.1.0**: Fixed the Ctrl combo triggering browser shortcuts and exiting while crouching with the AWP scoped (fullscreen keyboard lock); bots made weaker overall and able to slide; head hitbox is now a fitted ellipsoid and the neck no longer counts as a headshot; the death cam now orbits freely; remade both teams' character models and added side identification; added the butterfly knife and its inspect animation
- **v1.0.0**: First release

## File structure

```
index.html          Entry point
css/style.css       UI styles
lib/                three.js r147 and post-processing (bundled locally, works offline)
js/core.js          Constants, settings, input
js/audio.js         Procedurally synthesized sound + HRTF 3D positioning
js/textures.js      Procedural PBR textures
js/world.js         AABB collision world, rays, box sweeps
js/map.js           Map generation + vertex AO baking
js/nav.js           Navigation mesh + A*
js/weapons.js       Weapon data and ballistics
js/models.js        Weapon / character models (skinned)
js/effects.js       Particles, decals, tracers, shell casings, smoke
js/ragdoll.js       Ragdolls
js/actor.js         Movement physics and the weapon state machine
js/bot.js           Bot AI
js/viewmodel.js     First-person weapon animation
js/hud.js           HUD / radar / buy menu
js/game.js          Match logic and modes
js/net.js           Multiplayer: connection, lobby, snapshot sync, lag compensation
js/main.js          Render pipeline, menus, main loop
server/server.js    Multiplayer server (static hosting + WebSocket relay, zero dependencies)
start-lan-server.cmd  One-click multiplayer server launcher for Windows
docs/               Screenshots
```

## Technical notes

- **No external assets**: all sound is synthesized procedurally with Web Audio (including HRTF 3D positioning), all textures are code-generated PBR maps (albedo + normal + roughness), all models are lofted from primitive geometry, and the map is carved from a grid with vertex ambient occlusion baked in. The project contains no image, audio or model files.
- **Works offline**: three.js and the post-processing chain are bundled locally in `lib/` as UMD builds, so you can just double-click `index.html`. No server, no internet, no build step.
- **Multiplayer**: the host's browser runs the authoritative match and sends 64 Hz snapshots; joiners predict their own movement locally (map collision is deterministic on both ends) and see other characters interpolated by 50 ms; the host keeps 0.375 s of position history and rewinds to the moment the shooter saw when judging hits. The server only relays messages and ships its own minimal WebSocket implementation, so no `npm install` is needed.
- **Consistent handling**: 128 tick fixed-step physics plus render interpolation; movement, acceleration, counter-strafing, recoil and spread all follow classic FPS numeric models.

## License

The original code in this project is open source under the [MIT License](LICENSE).

three.js and its example code under `lib/` are third-party components; copyright belongs to their original authors and they are likewise distributed under the MIT License. See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

This project is an original fan work. It is not affiliated with any commercial game or its publisher, and uses none of any third-party game's art, audio or code.

Upstream: <https://github.com/Kwusv55/Cla-Go> (MIT, by Kwusv55).

This fork is the English Engage Edition of Cla-Go, maintained by Engage.

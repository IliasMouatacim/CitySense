"""Refit reviewed photo correspondences; requires numpy and scipy, offline only.

Run from the repository root. The default is read-only; --write updates the
camera fits. World points use ENU metres anchored at 6.8 E, 47.51 N, with Z
relative to the city terrain datum. Pixel landmarks must be inspected manually.
"""
import argparse
import json
import math
from pathlib import Path

import numpy as np
from scipy.optimize import least_squares
from scipy.spatial.transform import Rotation

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--manifest', default='apps/web/public/city/panoramax-facades.json')
parser.add_argument('--write', action='store_true')
args = parser.parse_args()
path = Path(args.manifest)
catalog = json.loads(path.read_text())

for name, projection in catalog['projections'].items():
    width, height = projection.get('calibrationImageSize', catalog['source']['imageSize'])
    matches = projection['correspondences']
    if len(matches) < 3:
        raise ValueError(f'{name}: at least three reviewed landmarks are required')
    points = np.array([m['world'] for m in matches], dtype=float)
    pixels = np.array([m['pixel'] for m in matches], dtype=float)
    angles = (pixels / [width, height] - .5) * [2 * math.pi, -math.pi]
    theta, phi = angles[:, 0], angles[:, 1]
    observed = np.column_stack((np.sin(theta) * np.cos(phi), np.cos(theta) * np.cos(phi), np.sin(phi)))
    camera = np.array(projection['camera'])

    def residual(params):
        rays = points - params[:3]
        rays /= np.linalg.norm(rays, axis=1)[:, None]
        predicted = Rotation.from_rotvec(params[3:]).apply(rays)
        # Weak regularization keeps an ambiguous three-point fit near the
        # previously reviewed camera, rather than selecting a remote solution.
        return np.concatenate(((predicted - observed).ravel(), (params[:3] - camera) * .00001))

    initial = np.concatenate((camera, Rotation.from_matrix(projection['worldToPhotoRotation']).as_rotvec()))
    fit = least_squares(residual, initial, max_nfev=2000)
    rotation = Rotation.from_rotvec(fit.x[3:])
    rays = rotation.apply(points - fit.x[:3])
    projected = np.column_stack((width * (.5 + np.arctan2(rays[:, 0], rays[:, 1]) / (2 * math.pi)), height * (.5 - np.arctan2(rays[:, 2], np.hypot(rays[:, 0], rays[:, 1])) / math.pi)))
    error = float(np.max(np.linalg.norm(projected - pixels, axis=1)))
    if not fit.success or error > 2:
        raise ValueError(f'{name}: calibration failed, maximum landmark error {error:.2f} px')
    print(f'{name}: {len(matches)} reviewed landmarks, max fit residual {error:.3f} px; not an independent accuracy estimate')
    if args.write:
        projection['camera'] = fit.x[:3].tolist()
        projection['worldToPhotoRotation'] = rotation.as_matrix().tolist()

if args.write:
    path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
    print('Updated camera fits. Inspect the result visually before publishing.')

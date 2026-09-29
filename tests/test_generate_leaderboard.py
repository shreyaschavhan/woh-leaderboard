import unittest
from datetime import date

import generate_leaderboard as leaderboard


class ComparisonEntryTests(unittest.TestCase):
    TODAY = date(2026, 9, 29)
    TRAINER = 'trainer'

    def history(self, *entries):
        return {self.TRAINER: list(entries)}

    def test_exact_seven_day_snapshot_wins(self):
        history = self.history(
            {'date': '2026-09-19', 'rank': 3, 'flowers': 10},
            {'date': '2026-09-22', 'rank': 2, 'flowers': 20},
            {'date': '2026-09-23', 'rank': 1, 'flowers': 30},
        )

        result = leaderboard.get_comparison_entry(history, self.TRAINER, self.TODAY)

        self.assertEqual('2026-09-22', result['date'])

    def test_nearest_snapshot_bridges_short_collection_outage(self):
        history = self.history(
            {'date': '2026-09-19', 'rank': 3, 'flowers': 10},
            {'date': '2026-09-23', 'rank': 2, 'flowers': 20},
        )

        result = leaderboard.get_comparison_entry(history, self.TRAINER, self.TODAY)

        self.assertEqual('2026-09-23', result['date'])

    def test_equal_distance_prefers_older_snapshot(self):
        history = self.history(
            {'date': '2026-09-21', 'rank': 3, 'flowers': 10},
            {'date': '2026-09-23', 'rank': 2, 'flowers': 20},
        )

        result = leaderboard.get_comparison_entry(history, self.TRAINER, self.TODAY)

        self.assertEqual('2026-09-21', result['date'])

    def test_snapshot_outside_tolerance_is_unavailable(self):
        history = self.history(
            {'date': '2026-09-18', 'rank': 3, 'flowers': 10},
        )

        result = leaderboard.get_comparison_entry(history, self.TRAINER, self.TODAY)

        self.assertIsNone(result)

    def test_rank_and_flower_change_share_fallback_snapshot(self):
        history = self.history(
            {'date': 'invalid', 'rank': 99, 'flowers': 99},
            {'date': '2026-09-23', 'rank': 13, 'flowers': 0},
            {'date': '2026-09-29', 'rank': 8, 'flowers': 66},
        )

        previous_rank = leaderboard.get_rank_change(
            history, self.TRAINER, self.TODAY
        )
        _, _, gain7, _, _ = leaderboard.compute_extras(
            history, self.TRAINER, 66, self.TODAY
        )

        self.assertEqual(13, previous_rank)
        self.assertEqual(66, gain7)


if __name__ == '__main__':
    unittest.main()

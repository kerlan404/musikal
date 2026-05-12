-- Database: music_streaming
-- Generated for personal music streaming schema

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for song
-- ----------------------------
DROP TABLE IF EXISTS `song`;
CREATE TABLE `song` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `artist` varchar(255) DEFAULT NULL,
  `duration` int(11) NOT NULL COMMENT 'Duration in seconds',
  `youtube_id` varchar(50) DEFAULT NULL,
  `thumbnail_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_song_title` (`title`),
  KEY `idx_song_artist` (`artist`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for playlist
-- ----------------------------
DROP TABLE IF EXISTS `playlist`;
CREATE TABLE `playlist` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_playlist_user` (`user_id`),
  CONSTRAINT `fk_playlist_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for playlist_song
-- ----------------------------
DROP TABLE IF EXISTS `playlist_song`;
CREATE TABLE `playlist_song` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `playlist_id` int(11) NOT NULL,
  `song_id` int(11) NOT NULL,
  `urutan` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_playlist_song_unique` (`playlist_id`,`song_id`),
  KEY `fk_playlist_song_song` (`song_id`),
  CONSTRAINT `fk_playlist_song_playlist` FOREIGN KEY (`playlist_id`) REFERENCES `playlist` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_playlist_song_song` FOREIGN KEY (`song_id`) REFERENCES `song` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Dummy Data for user
-- ----------------------------
INSERT INTO `user` (`username`, `password`) VALUES 
('rezy_admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('johndoe', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('music_lover', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('melodic_soul', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('beat_master', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- ----------------------------
-- Dummy Data for song
-- ----------------------------
INSERT INTO `song` (`title`, `artist`, `duration`, `youtube_id`, `thumbnail_url`) VALUES 
('Blinding Lights', 'The Weeknd', 200, '4NRXx6U8ABQ', 'https://img.youtube.com/vi/4NRXx6U8ABQ/0.jpg'),
('Levitating', 'Dua Lipa', 203, 'TUVcZfQe-Kw', 'https://img.youtube.com/vi/TUVcZfQe-Kw/0.jpg'),
('Save Your Tears', 'The Weeknd', 215, 'XXYlFuWEuKI', 'https://img.youtube.com/vi/XXYlFuWEuKI/0.jpg'),
('Stay', 'The Kid LAROI & Justin Bieber', 141, 'kTJczUoc26U', 'https://img.youtube.com/vi/kTJczUoc26U/0.jpg'),
('Peaches', 'Justin Bieber', 198, 'tQ0yjYUFKAE', 'https://img.youtube.com/vi/tQ0yjYUFKAE/0.jpg');

-- ----------------------------
-- Dummy Data for playlist
-- ----------------------------
INSERT INTO `playlist` (`name`, `user_id`) VALUES 
('My Favorites', 1),
('Workout Mix', 1),
('Chill Vibes', 2),
('Top Hits 2024', 3),
('Late Night', 4);

-- ----------------------------
-- Dummy Data for playlist_song
-- ----------------------------
INSERT INTO `playlist_song` (`playlist_id`, `song_id`, `urutan`) VALUES 
(1, 1, 1),
(1, 3, 2),
(2, 2, 1),
(3, 4, 1),
(3, 5, 2);

SET FOREIGN_KEY_CHECKS = 1;
